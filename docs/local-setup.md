# Local setup (Windows)

## Prerequisites

- Node.js **22.13.0 or later**.
- npm 11 or later.
- VS Code with the ESLint and Expo Tools extensions recommended.
- A Prisma Postgres development database and its connection URL.
- Expo Go on an Android or iOS device, or an Android emulator.

## Install and run

### Fastest option (recommended on Windows)

Double-click `start-docconnect.cmd` in the project root. It opens two Command Prompt windows:

- **DocConnect API Gateway** — backend at `http://localhost:3000`
- **DocConnect Mobile** — Expo / QR code

The launcher calls `C:\Program Files\nodejs\npm.cmd` directly, so it works even if a PowerShell terminal opened before Node.js was installed and cannot find `npm` yet.

Use `run-gateway.cmd` or `run-mobile.cmd` if you need only one of them.

### Terminal option

From the repository root:

```powershell
npm install
npm run gateway
```

In a second terminal:

```powershell
npm run mobile
```

If Expo reports that port `8081` is already in use, either stop that earlier Expo process or use a different port:

```powershell
npm run mobile -- --port 8082
```

Before running the Gateway, copy `services/api-gateway/.env.example` to `services/api-gateway/.env`, then add the pooled Prisma connection URL and a unique JWT secret. The secret can be generated with:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Open `http://localhost:3000/health` in a browser while the Gateway is running. It should return JSON with `"status": "ok"`.

## Mobile-to-Gateway connection

Before starting Expo, copy `apps/mobile/.env.example` to `apps/mobile/.env` and set its one public value:

```env
EXPO_PUBLIC_API_BASE_URL=http://YOUR_COMPUTER_LAN_IP:3000
```

For Expo Web on the same computer, use `http://localhost:3000`. For a real phone, use the computer's LAN IPv4 address and ensure the phone and computer are on the same network. A phone's `localhost` is the phone itself, not this computer. This mobile `.env` contains only the API address—never put the database URL, JWT secret, Cloudinary secret, or SMTP credentials in it.

## Cloud database and Prisma

DocConnect uses Prisma Postgres, so local PostgreSQL installation is not required. Put the pooled database URL in `services/database/.env`:

```env
DATABASE_URL="your-pooled-prisma-postgres-url"
```

The initial migration has already been applied to the configured development database. For later schema changes use:

```powershell
npm run database:migrate -- --name describe_change
```

Before a later migration, add Prisma Console's direct database URL as `DIRECT_URL` in `services/database/.env`.

## Email OTP delivery

The gateway exposes local-only OTP routes under `/api/v1/auth`:

- `POST /email-otp/request`
- `POST /email-otp/verify`
- `GET /me` with `Authorization: Bearer YOUR_ACCESS_TOKEN`

With `OTP_DELIVERY_MODE=development`, the request endpoint returns a temporary `developmentCode`; it does **not** send email. The mobile Verify OTP screen displays that code only in development mode.

To send real OTP emails, add the SMTP values from `services/api-gateway/.env.example` to `services/api-gateway/.env` and set:

```env
OTP_DELIVERY_MODE=smtp
```

The gateway verifies the SMTP connection and login during startup. Use `SMTP_SECURE=true` for a provider's implicit TLS port (normally `465`); for STARTTLS on `587`, set it to `false`. Keep the SMTP password only in the gateway `.env`, never in `apps/mobile/.env`. See [API Gateway](api-gateway.md) for payloads.

### Gmail test setup

For local testing with a personal Gmail account, enable 2-Step Verification, create a dedicated **App Password**, and use its generated password (not your normal Gmail password). Google requires 2-Step Verification before App Passwords are available, and some managed/Advanced Protection accounts cannot use them. [Google's App Password guide](https://support.google.com/accounts/answer/185833?hl=en) has the current account requirements.

```env
OTP_DELIVERY_MODE=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-gmail-address@gmail.com
SMTP_PASSWORD=your-16-character-app-password
SMTP_FROM="DocConnect <your-gmail-address@gmail.com>"
```

For production, use an SMTP provider/domain that is authorised to send as `SMTP_FROM`; do not use a personal mailbox for patient-facing mail.
