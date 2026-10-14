import { PushTokenModel } from '../models/push-token.model.js';

type PushPayload = {
  body: string;
  data: Record<string, string>;
  title: string;
};

type ExpoPushTicket = {
  details?: { error?: string };
  status?: 'error' | 'ok';
};

const expoPushTokenPattern = /^(?:Expo|Exponent)PushToken\[[^\]]+\]$/;
const expoPushUrl = 'https://exp.host/--/api/v2/push/send';

export function isExpoPushToken(value: unknown): value is string {
  return typeof value === 'string' && expoPushTokenPattern.test(value);
}

export class ExpoPushService {
  constructor(
    private readonly pushTokenModel: PushTokenModel,
    private readonly accessToken?: string,
  ) {}

  async sendToUsers(userIds: string[], payload: PushPayload) {
    const registeredTokens = await this.pushTokenModel.listForUsers([...new Set(userIds)]);
    const tokens = registeredTokens.map((entry) => entry.token).filter(isExpoPushToken);

    if (tokens.length === 0) {
      return;
    }

    try {
      const response = await fetch(expoPushUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
          ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
        },
        body: JSON.stringify(tokens.map((to) => ({ ...payload, sound: 'default', to }))),
      });

      if (!response.ok) {
        console.warn(`Expo push service returned HTTP ${response.status}.`);
        return;
      }

      const result = await response.json().catch(() => undefined) as { data?: ExpoPushTicket[] } | undefined;
      const expiredTokens = (result?.data || []).flatMap((ticket, index) => (
        ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered' && tokens[index]
          ? [tokens[index]]
          : []
      ));
      await this.pushTokenModel.removeTokens(expiredTokens);
    } catch {
      // A push provider outage must never prevent a consultation or message from being saved.
      console.warn('Could not deliver an Expo push notification.');
    }
  }
}
