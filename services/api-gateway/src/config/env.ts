function readPort(value: string | undefined, fallback: number) {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 ? port : fallback;
}

function readBoolean(value: string | undefined) {
  return value?.trim().toLowerCase() === 'true';
}

const otpDeliveryMode: 'development' | 'smtp' = process.env.OTP_DELIVERY_MODE === 'smtp' ? 'smtp' : 'development';

export const env = {
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY?.trim(),
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET?.trim(),
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
  corsOrigin: process.env.CORS_ORIGIN?.trim() || 'http://localhost:8081',
  databaseUrl: process.env.DATABASE_URL?.trim(),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN?.trim() || '7d',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET?.trim(),
  otpDeliveryMode,
  port: readPort(process.env.API_GATEWAY_PORT, 3000),
  smtpFrom: process.env.SMTP_FROM?.trim(),
  smtpHost: process.env.SMTP_HOST?.trim(),
  smtpPassword: process.env.SMTP_PASSWORD,
  smtpPort: readPort(process.env.SMTP_PORT, 587),
  smtpSecure: readBoolean(process.env.SMTP_SECURE),
  smtpUser: process.env.SMTP_USER?.trim(),
};
