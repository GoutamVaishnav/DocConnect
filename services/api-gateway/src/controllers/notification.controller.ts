import type { Response } from 'express';

import type { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { NotificationService } from '../services/notification.service.js';

type IdParams = { notificationId?: string };
type ListQuery = { cursor?: unknown; limit?: unknown };
type PushTokenBody = { platform?: unknown; token?: unknown };

const idPattern = /^[0-9a-f-]{36}$/i;

function sendError(response: Response, status: number, code: string, message: string) {
  response.status(status).json({ error: { code, message } });
}

function readListOptions(query: ListQuery) {
  const limit = query.limit === undefined ? 30 : Number(query.limit);
  const cursor = query.cursor;

  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    return undefined;
  }

  if (cursor !== undefined && (typeof cursor !== 'string' || !idPattern.test(cursor))) {
    return undefined;
  }

  return { cursor, limit };
}

function toPublicNotification<T extends { userId: string }>(notification: T): Omit<T, 'userId'> {
  const { userId: _userId, ...publicNotification } = notification;
  return publicNotification;
}

export function createNotificationController(notificationService: NotificationService) {
  return {
    list: async (
      request: AuthenticatedRequest & { query: ListQuery },
      response: Response,
    ) => {
      const options = readListOptions(request.query);
      if (!options) {
        sendError(response, 400, 'VALIDATION_ERROR', 'Provide a limit from 1 to 50 and an optional notification cursor.');
        return;
      }

      const page = await notificationService.listForUser(request.authUser!.id, options);
      if (!page) {
        sendError(response, 400, 'INVALID_CURSOR', 'The notification cursor does not belong to this account.');
        return;
      }

      response.status(200).json({
        data: {
          nextCursor: page.nextCursor,
          notifications: page.notifications.map(toPublicNotification),
        },
      });
    },

    markRead: async (
      request: AuthenticatedRequest & { params: IdParams },
      response: Response,
    ) => {
      const notificationId = request.params.notificationId;
      if (!notificationId || !idPattern.test(notificationId)) {
        sendError(response, 400, 'VALIDATION_ERROR', 'Provide a valid notification id.');
        return;
      }

      const notification = await notificationService.markRead(request.authUser!.id, notificationId);
      if (!notification) {
        sendError(response, 404, 'NOTIFICATION_NOT_FOUND', 'This notification is not available to this account.');
        return;
      }

      response.status(200).json({ data: { notification: toPublicNotification(notification) } });
    },

    markAllRead: async (request: AuthenticatedRequest, response: Response) => {
      const updatedCount = await notificationService.markAllRead(request.authUser!.id);
      response.status(200).json({ data: { updatedCount } });
    },

    registerPushToken: async (
      request: AuthenticatedRequest & { body: PushTokenBody },
      response: Response,
    ) => {
      const pushToken = await notificationService.registerPushToken(
        request.authUser!.id,
        request.body.token,
        request.body.platform,
      );
      if (!pushToken) {
        sendError(response, 400, 'VALIDATION_ERROR', 'Provide a valid Expo push token and platform (ANDROID or IOS).');
        return;
      }

      response.status(201).json({ data: { pushToken } });
    },

    unregisterPushToken: async (
      request: AuthenticatedRequest & { body: PushTokenBody },
      response: Response,
    ) => {
      const removed = await notificationService.unregisterPushToken(request.authUser!.id, request.body.token);
      if (removed === undefined) {
        sendError(response, 400, 'VALIDATION_ERROR', 'Provide a valid Expo push token.');
        return;
      }

      response.status(200).json({ data: { removed } });
    },
  };
}
