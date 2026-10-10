# API Gateway (local development)

Base URL: `http://localhost:3000`

The gateway source is intentionally split into simple folders: `routes`, `controllers`, `models`, `middlewares`, `app.ts`, and `server.ts`. See [backend architecture](backend-architecture.md).

## Available endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Gateway health and database connection status |
| `GET` | `/api/v1` | API version check |
| `POST` | `/api/v1/auth/email-otp/request` | Generate a local development OTP for an email and role |
| `POST` | `/api/v1/auth/email-otp/verify` | Verify the temporary development OTP |

### Request an OTP

```json
{
  "email": "rohan@example.com",
  "role": "PATIENT"
}
```

With `OTP_DELIVERY_MODE=development`, the response includes `developmentCode` for local testing. No email is sent. The code expires in ten minutes, requests have a sixty-second cooldown, and verification permits five attempts.

Production email delivery is intentionally not available until an SMTP/email provider and secret management are configured.
