# Local setup (Windows)

## Prerequisites

- Node.js **22.13.0 or later**. The computer currently has Node 22.11.0, which is below the React Native version's supported minimum.
- npm 11 or later.
- VS Code with the ESLint and Expo Tools extensions recommended.
- PostgreSQL installed locally. No database is required in Phase 1; it will be configured with the Auth Service in Phase 3.
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

Open `http://localhost:3000/health` in a browser while the gateway is running. It should return JSON with `"status": "ok"`. The initial status will show `"database": "not-connected"` until PostgreSQL and migrations are configured.

For a real phone, copy `.env.example` to `.env`, replace `192.168.1.100` with your computer's LAN IPv4 address, and ensure the phone and computer are on the same network. A phone's `localhost` is the phone itself, not this computer.

## Database foundation

The initial PostgreSQL schema is available at `services/database/schema/001_initial.sql`. It has not been run automatically. After PostgreSQL is installed, this command should prompt for a password and open a PostgreSQL shell:

```powershell
psql -U postgres -d postgres
```

Create a dedicated `docconnect_dev` database, set `DATABASE_URL` in `.env`, then run the schema only against that development database. A migration runner will be added before the app connects to the database.

## Development email OTP

The gateway exposes local-only OTP routes under `/api/v1/auth`:

- `POST /email-otp/request`
- `POST /email-otp/verify`

With `OTP_DELIVERY_MODE=development`, the request endpoint returns a temporary `developmentCode`; it does **not** send email. SMTP/email provider delivery will be added once credentials and provider choice are available. See [API Gateway](api-gateway.md) for payloads.
