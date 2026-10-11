import nodemailer from 'nodemailer';

import type { AuthRole } from '../models/otp.model.js';

export type OtpEmailInput = {
  code: string;
  email: string;
  expiresInSeconds: number;
  role: AuthRole;
};

export type OtpEmailSender = {
  sendEmailOtp(input: OtpEmailInput): Promise<void>;
};

export type SmtpConfiguration = {
  from: string;
  host: string;
  password: string;
  port: number;
  secure: boolean;
  user: string;
};

export class SmtpOtpEmailSender implements OtpEmailSender {
  private readonly transporter;

  constructor(private readonly configuration: SmtpConfiguration) {
    this.transporter = nodemailer.createTransport({
      auth: {
        pass: configuration.password,
        user: configuration.user,
      },
      host: configuration.host,
      port: configuration.port,
      secure: configuration.secure,
    });
  }

  async verifyConfiguration() {
    await this.transporter.verify();
  }

  async sendEmailOtp({ code, email, expiresInSeconds, role }: OtpEmailInput) {
    const recipientRole = role === 'DOCTOR' ? 'doctor' : 'patient';
    const expiresInMinutes = Math.ceil(expiresInSeconds / 60);

    const result = await this.transporter.sendMail({
      from: this.configuration.from,
      html: `
        <div style="font-family: Arial, sans-serif; color: #14213D; max-width: 480px; margin: 0 auto;">
          <h2>DocConnect verification code</h2>
          <p>Use this code to sign in as a ${recipientRole}:</p>
          <p style="font-size: 30px; font-weight: 700; letter-spacing: 8px; margin: 24px 0;">${code}</p>
          <p>This code expires in ${expiresInMinutes} minutes. Do not share it with anyone.</p>
          <p>If you did not request this code, you can safely ignore this email.</p>
        </div>
      `,
      subject: 'Your DocConnect verification code',
      text: `Your DocConnect verification code is ${code}. It expires in ${expiresInMinutes} minutes. Do not share it with anyone.`,
      to: email,
    });

    console.info('OTP email accepted by SMTP provider.', { messageId: result.messageId });
  }
}
