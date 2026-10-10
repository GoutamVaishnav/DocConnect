import { Router } from 'express';

import { createAuthController } from '../controllers/auth.controller.js';
import { OtpModel } from '../models/otp.model.js';

export function createAuthRouter(otpDeliveryMode: 'development' | 'smtp') {
  const router = Router();
  const authController = createAuthController(new OtpModel(), otpDeliveryMode);

  router.post('/email-otp/request', authController.requestEmailOtp);
  router.post('/email-otp/verify', authController.verifyEmailOtp);

  return router;
}
