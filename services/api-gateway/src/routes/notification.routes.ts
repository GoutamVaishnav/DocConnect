import { Router } from 'express';

import { createNotificationController } from '../controllers/notification.controller.js';
import { createRequireAuthentication } from '../middlewares/auth.middleware.js';
import { TokenModel } from '../models/token.model.js';
import { NotificationService } from '../services/notification.service.js';

export function createNotificationRouter(
  jwtAccessSecret: string,
  jwtAccessExpiresIn: string,
  notificationService: NotificationService,
) {
  const router = Router();
  const requireAuthentication = createRequireAuthentication(new TokenModel(jwtAccessSecret, jwtAccessExpiresIn));
  const notificationController = createNotificationController(notificationService);

  router.use(requireAuthentication);
  router.get('/', notificationController.list);
  router.patch('/read-all', notificationController.markAllRead);
  router.patch('/:notificationId/read', notificationController.markRead);
  router.post('/push-tokens', notificationController.registerPushToken);
  router.delete('/push-tokens', notificationController.unregisterPushToken);

  return router;
}
