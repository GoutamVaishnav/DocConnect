import 'dotenv/config';

import { createApp } from './app.js';
import { env } from './config/env.js';
import { SmtpOtpEmailSender } from './services/otp-email.service.js';

function requireStartupConfiguration() {
  const missingVariables = [
    ['DATABASE_URL', env.databaseUrl],
    ['JWT_ACCESS_SECRET', env.jwtAccessSecret],
  ];

  if (env.otpDeliveryMode === 'smtp') {
    missingVariables.push(
      ['SMTP_HOST', env.smtpHost],
      ['SMTP_USER', env.smtpUser],
      ['SMTP_PASSWORD', env.smtpPassword],
      ['SMTP_FROM', env.smtpFrom],
    );
  }

  const missingNames = missingVariables
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missingNames.length > 0) {
    throw new Error(`Missing required environment variable(s): ${missingNames.join(', ')}.`);
  }
}

async function startServer() {
  requireStartupConfiguration();

  const otpEmailSender = env.otpDeliveryMode === 'smtp'
    ? new SmtpOtpEmailSender({
      from: env.smtpFrom || '',
      host: env.smtpHost || '',
      password: env.smtpPassword || '',
      port: env.smtpPort,
      secure: env.smtpSecure,
      user: env.smtpUser || '',
    })
    : undefined;

  if (otpEmailSender) {
    await otpEmailSender.verifyConfiguration();
    console.log('SMTP connection verified for OTP email delivery.');
  }

  const app = createApp({ otpEmailSender });

  app.listen(env.port, () => {
    console.log(`DocConnect API Gateway is listening on http://localhost:${env.port}`);
  });
}

void startServer().catch((error) => {
  console.error('DocConnect API Gateway could not start.', error);
  process.exitCode = 1;
});
