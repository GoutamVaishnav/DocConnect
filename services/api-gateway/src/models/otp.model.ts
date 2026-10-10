import { randomInt, randomUUID } from 'node:crypto';

export type AuthRole = 'DOCTOR' | 'PATIENT';

type PendingOtp = {
  attempts: number;
  code: string;
  expiresAt: number;
};

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_VERIFICATION_ATTEMPTS = 5;

// This is an in-memory development model. It will later be replaced by PostgreSQL.
export class OtpModel {
  private readonly lastRequestedAt = new Map<string, number>();
  private readonly pendingOtps = new Map<string, PendingOtp>();

  create(email: string, role: AuthRole) {
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

  verify(email: string, role: AuthRole, code: string) {
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
    return { ok: true as const, sessionId: randomUUID() };
  }

  private keyFor(email: string, role: AuthRole) {
    return `${role}:${email.trim().toLowerCase()}`;
  }
}
