import { Router } from 'express';

import { createAuthController } from '../controllers/auth.controller.js';
import { createRequireAuthentication } from '../middlewares/auth.middleware.js';
import { DatabaseOtpModel, OtpModel } from '../models/otp.model.js';
import { TokenModel } from '../models/token.model.js';
import { UserModel } from '../models/user.model.js';
import type { OtpEmailSender } from '../services/otp-email.service.js';

export function createAuthRouter(
  otpDeliveryMode: 'development' | 'smtp',
  useDatabaseOtp: boolean,
  jwtAccessSecret: string,
  jwtAccessExpiresIn: string,
  otpEmailSender?: OtpEmailSender,
) {
  const router = Router();
  const otpModel = useDatabaseOtp ? new DatabaseOtpModel() : new OtpModel();
  const tokenModel = new TokenModel(jwtAccessSecret, jwtAccessExpiresIn);
  const authController = createAuthController(otpModel, tokenModel, new UserModel(), otpDeliveryMode, otpEmailSender);
  const requireAuthentication = createRequireAuthentication(tokenModel);

  router.post('/email-otp/request', authController.requestEmailOtp);
  router.post('/email-otp/verify', authController.verifyEmailOtp);
  router.get('/me', requireAuthentication, authController.getCurrentUser);

  return router;
}
