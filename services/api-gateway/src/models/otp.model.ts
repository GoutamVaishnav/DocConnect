import { createHash, randomInt, randomUUID } from 'node:crypto';

import { getPrismaClient } from '@docconnect/database';
import type { UserRoleValue } from '@docconnect/database';

export type AuthRole = 'DOCTOR' | 'PATIENT';

export type AuthenticatedUser = {
  email: string;
  id: string;
  role: AuthRole;
};

type PendingOtp = {
  attempts: number;
  code: string;
  expiresAt: number;
};

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_VERIFICATION_ATTEMPTS = 5;

type OtpCreateResult =
  | { code: string; expiresInSeconds: number; ok: true }
  | { ok: false; retryAfterSeconds: number };

type OtpVerificationResult =
  | { ok: true; user: AuthenticatedUser }
  | {
      attemptsRemaining?: number;
      ok: false;
      reason: 'attempts_exceeded' | 'expired' | 'invalid_code' | 'role_mismatch';
    };

export type OtpStore = {
  create(email: string, role: AuthRole): Promise<OtpCreateResult>;
  verify(email: string, role: AuthRole, code: string): Promise<OtpVerificationResult>;
};

// This fallback lets the Gateway run before DATABASE_URL is configured for it.
export class OtpModel implements OtpStore {
  private readonly lastRequestedAt = new Map<string, number>();
  private readonly pendingOtps = new Map<string, PendingOtp>();

  async create(email: string, role: AuthRole): Promise<OtpCreateResult> {
    const key = this.keyFor(email, role);
    const now = Date.now();
    const lastRequestedAt = this.lastRequestedAt.get(key);

    if (lastRequestedAt && now - lastRequestedAt < OTP_RESEND_COOLDOWN_MS) {
      return {
        ok: false as const,
        retryAfterSeconds: Math.ceil((OTP_RESEND_COOLDOWN_MS - (now - lastRequestedAt)) / 1000),
      };
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    this.pendingOtps.set(key, { attempts: 0, code, expiresAt: now + OTP_EXPIRY_MS });
    this.lastRequestedAt.set(key, now);

    return { code, expiresInSeconds: OTP_EXPIRY_MS / 1000, ok: true as const };
  }

  async verify(email: string, role: AuthRole, code: string): Promise<OtpVerificationResult> {
    const key = this.keyFor(email, role);
    const pendingOtp = this.pendingOtps.get(key);

    if (!pendingOtp || pendingOtp.expiresAt <= Date.now()) {
      this.pendingOtps.delete(key);
      return { ok: false as const, reason: 'expired' as const };
    }

    if (pendingOtp.attempts >= MAX_VERIFICATION_ATTEMPTS) {
      this.pendingOtps.delete(key);
      return { ok: false as const, reason: 'attempts_exceeded' as const };
    }

    if (pendingOtp.code !== code) {
      pendingOtp.attempts += 1;
      return {
        attemptsRemaining: Math.max(0, MAX_VERIFICATION_ATTEMPTS - pendingOtp.attempts),
        ok: false as const,
        reason: 'invalid_code' as const,
      };
    }

    this.pendingOtps.delete(key);
    return { ok: true as const, user: { email, id: randomUUID(), role } };
  }

  private keyFor(email: string, role: AuthRole) {
    return `${role}:${email.trim().toLowerCase()}`;
  }
}

export class DatabaseOtpModel implements OtpStore {
  private readonly prisma = getPrismaClient();

  async create(email: string, role: AuthRole): Promise<OtpCreateResult> {
    const now = new Date();
    const cooldownStartsAt = new Date(now.getTime() - OTP_RESEND_COOLDOWN_MS);
    const latestRequest = await this.prisma.emailOtpChallenge.findFirst({
      where: {
        createdAt: { gte: cooldownStartsAt },
        email,
        role: role as UserRoleValue,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (latestRequest) {
      const retryAfterSeconds = Math.ceil(
        (OTP_RESEND_COOLDOWN_MS - (now.getTime() - latestRequest.createdAt.getTime())) / 1000,
      );

      return { ok: false, retryAfterSeconds: Math.max(1, retryAfterSeconds) };
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    await this.prisma.emailOtpChallenge.create({
      data: {
        email,
        expiresAt: new Date(now.getTime() + OTP_EXPIRY_MS),
        otpHash: this.hashOtp(email, role, code),
        role: role as UserRoleValue,
      },
    });

    return { code, expiresInSeconds: OTP_EXPIRY_MS / 1000, ok: true };
  }

  async verify(email: string, role: AuthRole, code: string): Promise<OtpVerificationResult> {
    const challenge = await this.prisma.emailOtpChallenge.findFirst({
      where: {
        email,
        role: role as UserRoleValue,
        verifiedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!challenge || challenge.expiresAt <= new Date()) {
      return { ok: false, reason: 'expired' };
    }

    if (challenge.attempts >= MAX_VERIFICATION_ATTEMPTS) {
      return { ok: false, reason: 'attempts_exceeded' };
    }

    if (challenge.otpHash !== this.hashOtp(email, role, code)) {
      const updatedChallenge = await this.prisma.emailOtpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });

      return {
        attemptsRemaining: Math.max(0, MAX_VERIFICATION_ATTEMPTS - updatedChallenge.attempts),
        ok: false,
        reason: 'invalid_code',
      };
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser && existingUser.role !== (role as UserRoleValue)) {
      return { ok: false, reason: 'role_mismatch' };
    }

    const verifiedAt = new Date();
    const [, user] = await this.prisma.$transaction([
      this.prisma.emailOtpChallenge.update({
        where: { id: challenge.id },
        data: { verifiedAt },
      }),
      this.prisma.user.upsert({
        where: { email },
        create: { email, emailVerifiedAt: verifiedAt, role: role as UserRoleValue },
        update: { emailVerifiedAt: verifiedAt },
      }),
    ]);

    return {
      ok: true,
      user: { email: user.email, id: user.id, role: user.role as AuthRole },
    };
  }

  private hashOtp(email: string, role: AuthRole, code: string) {
    return createHash('sha256').update(`${email}:${role}:${code}`).digest('hex');
  }
}
