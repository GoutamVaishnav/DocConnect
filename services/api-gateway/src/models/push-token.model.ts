import { getPrismaClient } from '@docconnect/database';

export type DevicePlatform = 'ANDROID' | 'IOS';

export class PushTokenModel {
  async register(userId: string, token: string, platform: DevicePlatform) {
    return getPrismaClient().devicePushToken.upsert({
      where: { token },
      create: { platform, token, userId },
      update: { platform, userId },
      select: { platform: true, token: true, updatedAt: true },
    });
  }

  async listForUsers(userIds: string[]) {
    return getPrismaClient().devicePushToken.findMany({
      where: { userId: { in: userIds } },
      select: { token: true, userId: true },
    });
  }

  async removeForUser(userId: string, token: string) {
    const result = await getPrismaClient().devicePushToken.deleteMany({
      where: { token, userId },
    });

    return result.count > 0;
  }

  async removeTokens(tokens: string[]) {
    if (tokens.length === 0) {
      return;
    }

    await getPrismaClient().devicePushToken.deleteMany({ where: { token: { in: tokens } } });
  }
}
