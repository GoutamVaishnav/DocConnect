import { getPrismaClient } from '@docconnect/database';

import type { AuthenticatedUser, AuthRole } from './otp.model.js';

export class UserModel {
  async findAuthenticatedUserById(userId: string): Promise<AuthenticatedUser | undefined> {
    const user = await getPrismaClient().user.findUnique({
      where: { id: userId },
      select: { email: true, id: true, role: true },
    });

    if (!user || (user.role !== 'DOCTOR' && user.role !== 'PATIENT')) {
      return undefined;
    }

    return { email: user.email, id: user.id, role: user.role as AuthRole };
  }
}
