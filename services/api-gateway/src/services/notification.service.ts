import { NotificationModel, type CreateNotificationInput } from '../models/notification.model.js';
import { type DevicePlatform, PushTokenModel } from '../models/push-token.model.js';
import type { ChatEventPublisher } from '../realtime/chat-socket.js';
import { ExpoPushService, isExpoPushToken } from './expo-push.service.js';

type DeliveryRecord = Awaited<ReturnType<NotificationModel['create']>>;

export class NotificationService {
  private readonly expoPushService: ExpoPushService;

  constructor(
    private readonly notificationModel: NotificationModel,
    private readonly pushTokenModel: PushTokenModel,
    private readonly events?: ChatEventPublisher,
    expoPushAccessToken?: string,
  ) {
    this.expoPushService = new ExpoPushService(pushTokenModel, expoPushAccessToken);
  }

  async notifyUsers(userIds: string[], input: Omit<CreateNotificationInput, 'userId'>) {
    const notifications = await Promise.all(
      [...new Set(userIds)].map((userId) => this.notificationModel.create({ ...input, userId })),
    );
    await Promise.all(notifications.map((notification) => this.deliver(notification)));
    return notifications;
  }

  async notifyAvailableDoctors(consultationId: string) {
    const doctorIds = await this.notificationModel.listAvailableDoctorIds();
    return this.notifyUsers(doctorIds, {
      body: 'A patient submitted a new consultation request.',
      consultationId,
      title: 'New consultation request',
      type: 'CONSULTATION_REQUEST',
    });
  }

  async deliver(notification: DeliveryRecord) {
    this.events?.publishNotification({
      body: notification.body,
      consultationId: notification.consultationId,
      createdAt: notification.createdAt,
      id: notification.id,
      readAt: notification.readAt,
      title: notification.title,
      type: notification.type,
      userId: notification.userId,
    });

    await this.expoPushService.sendToUsers([notification.userId], {
      body: notification.body,
      data: {
        consultationId: notification.consultationId || '',
        notificationId: notification.id,
        notificationType: notification.type,
      },
      title: notification.title,
    });
  }

  async registerPushToken(userId: string, token: unknown, platform: unknown) {
    if (!isExpoPushToken(token) || (platform !== 'ANDROID' && platform !== 'IOS')) {
      return undefined;
    }

    return this.pushTokenModel.register(userId, token, platform as DevicePlatform);
  }

  async unregisterPushToken(userId: string, token: unknown) {
    return isExpoPushToken(token) ? this.pushTokenModel.removeForUser(userId, token) : undefined;
  }

  listForUser(userId: string, input: { cursor?: string; limit: number }) {
    return this.notificationModel.listForUser(userId, input);
  }

  markRead(userId: string, notificationId: string) {
    return this.notificationModel.markRead(userId, notificationId);
  }

  markAllRead(userId: string) {
    return this.notificationModel.markAllRead(userId);
  }
}
