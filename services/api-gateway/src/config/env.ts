function readPort(value: string | undefined, fallback: number) {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 ? port : fallback;
}

const otpDeliveryMode: 'development' | 'smtp' = process.env.OTP_DELIVERY_MODE === 'smtp' ? 'smtp' : 'development';

export const env = {
  corsOrigin: process.env.CORS_ORIGIN?.trim() || 'http://localhost:8081',
  otpDeliveryMode,
  port: readPort(process.env.API_GATEWAY_PORT, 3000),
};
