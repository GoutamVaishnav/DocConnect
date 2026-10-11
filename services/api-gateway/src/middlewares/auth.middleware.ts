import type { NextFunction, Request, Response } from 'express';

import type { AuthenticatedUser, AuthRole } from '../models/otp.model.js';
import { TokenModel } from '../models/token.model.js';

export type AuthenticatedRequest = Request & { authUser?: AuthenticatedUser };

function readBearerToken(header: string | undefined) {
  if (!header) {
    return undefined;
  }

  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : undefined;
}

export function createRequireAuthentication(tokenModel: TokenModel) {
  return (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    const token = readBearerToken(request.header('authorization'));
    const authUser = token ? tokenModel.readAccessToken(token) : undefined;

    if (!authUser) {
      response.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Provide a valid Bearer access token.',
        },
      });
      return;
    }

    request.authUser = authUser;
    next();
  };
}

export function createRequireRole(role: AuthRole) {
  return (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    if (!request.authUser) {
      response.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authenticate before accessing this resource.' },
      });
      return;
    }

    if (request.authUser.role !== role) {
      response.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `This endpoint is available only to ${role.toLowerCase()} accounts.`,
        },
      });
      return;
    }

    next();
  };
}
