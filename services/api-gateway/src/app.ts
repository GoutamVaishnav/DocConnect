import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import { createAuthRouter } from './routes/auth.routes.js';
import { createConsultationRouter } from './routes/consultation.routes.js';
import { createHealthRouter } from './routes/health.routes.js';
import { createProfileRouter } from './routes/profile.routes.js';
import { createNotificationRouter } from './routes/notification.routes.js';
import type { ChatEventPublisher } from './realtime/chat-socket.js';
import { NotificationModel } from './models/notification.model.js';
import { PushTokenModel } from './models/push-token.model.js';
import { NotificationService } from './services/notification.service.js';
import type { OtpEmailSender } from './services/otp-email.service.js';

export function getAllowedOrigins(): string[] | true {
  const configuredOrigins = env.corsOrigin;

  if (!configuredOrigins || configuredOrigins === '*') {
    return true;
  }

  return configuredOrigins.split(',').map((origin) => origin.trim());
}

type CreateAppOptions = {
  chatEvents?: ChatEventPublisher;
  otpEmailSender?: OtpEmailSender;
};

export function createApp({ chatEvents, otpEmailSender }: CreateAppOptions = {}) {
  const app = express();
  const notificationService = new NotificationService(
    new NotificationModel(),
    new PushTokenModel(),
    chatEvents,
    env.expoPushAccessToken,
  );

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: getAllowedOrigins() }));
  app.use(morgan('dev'));
  app.use(express.json({ limit: '100kb' }));

  app.use('/health', createHealthRouter());

  app.get('/api/v1', (_request, response) => {
    response.status(200).json({
      message: 'DocConnect API Gateway is running.',
      version: 'v1',
    });
  });

  app.use(
    '/api/v1/auth',
    createAuthRouter(
      env.otpDeliveryMode,
      Boolean(env.databaseUrl),
      env.jwtAccessSecret || '',
      env.jwtAccessExpiresIn,
      otpEmailSender,
    ),
  );
  app.use(
    '/api/v1/consultations',
    createConsultationRouter(env.jwtAccessSecret || '', env.jwtAccessExpiresIn, chatEvents, notificationService),
  );
  app.use('/api/v1/profile', createProfileRouter(env.jwtAccessSecret || '', env.jwtAccessExpiresIn));
  app.use('/api/v1/notifications', createNotificationRouter(env.jwtAccessSecret || '', env.jwtAccessExpiresIn, notificationService));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
