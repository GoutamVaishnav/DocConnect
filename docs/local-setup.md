# Local setup (Windows)

## Prerequisites

- Node.js **22.13.0 or later**.
- npm 11 or later.
- VS Code with the ESLint and Expo Tools extensions recommended.
- A Prisma Postgres development database and its connection URL.
- Expo Go on an Android or iOS device, or an Android emulator.

## Install and run

From the repository root:

```powershell
npm install
npm run gateway
```

In a second terminal:

```powershell
npm run mobile
```

Before running the Gateway, copy `services/api-gateway/.env.example` to `services/api-gateway/.env`, then add the pooled Prisma connection URL and a unique JWT secret. The secret can be generated with:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Open `http://localhost:3000/health` in a browser while the Gateway is running. It should return JSON with `"status": "ok"`.

For a real phone, copy `.env.example` to `.env`, replace `192.168.1.100` with your computer's LAN IPv4 address, and ensure the phone and computer are on the same network. A phone's `localhost` is the phone itself, not this computer.

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

## Development email OTP

The gateway exposes local-only OTP routes under `/api/v1/auth`:

- `POST /email-otp/request`
- `POST /email-otp/verify`
- `GET /me` with `Authorization: Bearer YOUR_ACCESS_TOKEN`

With `OTP_DELIVERY_MODE=development`, the request endpoint returns a temporary `developmentCode`; it does **not** send email. SMTP/email provider delivery will be added once credentials and provider choice are available. See [API Gateway](api-gateway.md) for payloads.
