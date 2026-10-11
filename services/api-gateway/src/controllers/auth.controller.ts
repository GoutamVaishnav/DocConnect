import type { Request, Response } from 'express';

import type { AuthRole, OtpStore } from '../models/otp.model.js';
import { TokenModel } from '../models/token.model.js';
import { UserModel } from '../models/user.model.js';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import type { OtpEmailSender } from '../services/otp-email.service.js';

type OtpRequestBody = { email?: unknown; role?: unknown };
type OtpVerificationBody = OtpRequestBody & { code?: unknown };

const validRoles = new Set<AuthRole>(['DOCTOR', 'PATIENT']);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readEmail(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const email = value.trim().toLowerCase();
  return emailPattern.test(email) ? email : undefined;
}

function readRole(value: unknown): AuthRole | undefined {
  return typeof value === 'string' && validRoles.has(value as AuthRole) ? (value as AuthRole) : undefined;
}

function sendValidationError(response: Response, message: string) {
  response.status(400).json({ error: { code: 'VALIDATION_ERROR', message } });
}

export function createAuthController(
  otpModel: OtpStore,
  tokenModel: TokenModel,
  userModel: UserModel,
  otpDeliveryMode: 'development' | 'smtp',
  otpEmailSender?: OtpEmailSender,
) {
  return {
    requestEmailOtp: async (request: Request<unknown, unknown, OtpRequestBody>, response: Response) => {
      const email = readEmail(request.body.email);
      const role = readRole(request.body.role);

      if (!email) {
        sendValidationError(response, 'Provide a valid email address.');
        return;
      }

      if (!role) {
        sendValidationError(response, 'Role must be PATIENT or DOCTOR.');
        return;
      }

      const result = await otpModel.create(email, role);

      if (!result.ok) {
        response.status(429).json({
          error: {
            code: 'OTP_RATE_LIMITED',
            message: `Try again in ${result.retryAfterSeconds} seconds.`,
          },
        });
        return;
      }

      if (otpDeliveryMode === 'smtp') {
        if (!otpEmailSender) {
          await otpModel.revoke(email, role, result.code);
          response.status(503).json({
            error: {
              code: 'EMAIL_TRANSPORT_UNAVAILABLE',
              message: 'SMTP email delivery is not configured on the server.',
            },
          });
          return;
        }

        try {
          await otpEmailSender.sendEmailOtp({
            code: result.code,
            email,
            expiresInSeconds: result.expiresInSeconds,
            role,
          });
        } catch (error) {
          await otpModel.revoke(email, role, result.code).catch(() => undefined);
          const reason = error instanceof Error ? error.message : 'Unknown SMTP error';
          console.error('OTP email delivery failed.', { reason });

          response.status(502).json({
            error: {
              code: 'EMAIL_DELIVERY_FAILED',
              message: 'We could not send the verification email. Please try again shortly.',
            },
          });
          return;
        }

        response.status(202).json({
          data: {
            delivery: 'smtp',
            email,
            expiresInSeconds: result.expiresInSeconds,
            message: 'Verification code sent to your email address.',
            role,
          },
        });
        return;
      }

      response.status(202).json({
        data: {
          delivery: 'development',
          developmentCode: result.code,
          email,
          expiresInSeconds: result.expiresInSeconds,
          message: 'Development OTP generated. No email was sent because SMTP is not configured.',
          role,
        },
      });
    },

    verifyEmailOtp: async (request: Request<unknown, unknown, OtpVerificationBody>, response: Response) => {
      const email = readEmail(request.body.email);
      const role = readRole(request.body.role);
      const code = typeof request.body.code === 'string' ? request.body.code.trim() : '';

      if (!email || !role || !/^\d{6}$/.test(code)) {
        sendValidationError(response, 'Provide a valid email, role, and six-digit OTP code.');
        return;
      }

      const result = await otpModel.verify(email, role, code);

      if (!result.ok) {
        const messages = {
          attempts_exceeded: 'Too many verification attempts. Request a new OTP.',
          expired: 'OTP expired or was not requested. Request a new OTP.',
          invalid_code: 'The OTP code is incorrect.',
          role_mismatch: 'This email is already registered with a different role.',
        } as const;

        response.status(result.reason === 'invalid_code' ? 401 : result.reason === 'role_mismatch' ? 409 : 410).json({
          error: {
            code: result.reason.toUpperCase(),
            message: messages[result.reason],
            ...(result.reason === 'invalid_code' ? { attemptsRemaining: result.attemptsRemaining } : {}),
          },
        });
        return;
      }

      response.status(200).json({
        data: {
          accessToken: tokenModel.createAccessToken(result.user),
          tokenType: 'Bearer',
          user: result.user,
        },
      });
    },

    getCurrentUser: async (request: AuthenticatedRequest, response: Response) => {
      const tokenUser = request.authUser;
      const user = tokenUser ? await userModel.findAuthenticatedUserById(tokenUser.id) : undefined;

      if (!user) {
        response.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'The authenticated user no longer exists.',
          },
        });
        return;
      }

      response.status(200).json({ data: { user } });
    },
  };
}
