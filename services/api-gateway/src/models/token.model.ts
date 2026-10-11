import jwt, { type SignOptions } from 'jsonwebtoken';

import type { AuthenticatedUser } from './otp.model.js';

type TokenPayload = {
  email?: unknown;
  role?: unknown;
  sub?: unknown;
};

const validRoles = new Set<AuthenticatedUser['role']>(['DOCTOR', 'PATIENT']);

export class TokenModel {
  constructor(
    private readonly accessSecret: string,
    private readonly accessExpiresIn: string,
  ) {}

  createAccessToken(user: AuthenticatedUser) {
    return jwt.sign(
      { email: user.email, role: user.role },
      this.accessSecret,
      {
        algorithm: 'HS256',
        expiresIn: this.accessExpiresIn as SignOptions['expiresIn'],
        subject: user.id,
      },
    );
  }

  readAccessToken(token: string): AuthenticatedUser | undefined {
    try {
      const payload = jwt.verify(token, this.accessSecret, { algorithms: ['HS256'] }) as TokenPayload;

      if (
        typeof payload.sub !== 'string' ||
        typeof payload.email !== 'string' ||
        typeof payload.role !== 'string' ||
        !validRoles.has(payload.role as AuthenticatedUser['role'])
      ) {
        return undefined;
      }

      return {
        email: payload.email,
        id: payload.sub,
        role: payload.role as AuthenticatedUser['role'],
      };
    } catch {
      return undefined;
    }
  }
}
