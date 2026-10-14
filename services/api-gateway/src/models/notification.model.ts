import { getPrismaClient } from '@docconnect/database';

export const notificationTypes = [
  'CONSULTATION_REQUEST',
  'CONSULTATION_ACCEPTED',
  'CONSULTATION_COMPLETED',
  'CHAT_MESSAGE',
] as const;

export type NotificationType = (typeof notificationTypes)[number];

export type CreateNotificationInput = {
  body: string;
  consultationId?: string;
  title: string;
  type: NotificationType;
  userId: string;
};

const notificationSelect = {
  body: true,
  consultationId: true,
  createdAt: true,
  id: true,
  readAt: true,
  title: true,
  type: true,
  userId: true,
} as const;

export class NotificationModel {
  async create(input: CreateNotificationInput) {
    return getPrismaClient().notification.create({
      data: input,
      select: notificationSelect,
    });
  }

  async listForUser(userId: string, input: { cursor?: string; limit: number }) {
    if (input.cursor) {
      const cursor = await getPrismaClient().notification.findFirst({
        where: { id: input.cursor, userId },
        select: { id: true },
      });

      if (!cursor) {
        return undefined;
      }
    }

    const newestFirst = await getPrismaClient().notification.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      select: notificationSelect,
      take: input.limit + 1,
    });
    const hasMore = newestFirst.length > input.limit;
    const notifications = newestFirst.slice(0, input.limit);

    return {
      nextCursor: hasMore ? notifications[notifications.length - 1]?.id ?? null : null,
      notifications,
    };
  }

  async markRead(userId: string, notificationId: string) {
    await getPrismaClient().notification.updateMany({
      where: { id: notificationId, readAt: null, userId },
      data: { readAt: new Date() },
    });

    return getPrismaClient().notification.findFirst({
      where: { id: notificationId, userId },
      select: notificationSelect,
    });
  }

  async markAllRead(userId: string) {
    const result = await getPrismaClient().notification.updateMany({
      where: { readAt: null, userId },
      data: { readAt: new Date() },
    });

    return result.count;
  }

  async listAvailableDoctorIds() {
    const doctors = await getPrismaClient().doctorProfile.findMany({
      where: { availabilityEnabled: true },
      select: { userId: true },
    });

    return doctors.map((doctor) => doctor.userId);
  }
}
