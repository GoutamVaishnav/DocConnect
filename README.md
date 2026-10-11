# DocConnect

DocConnect is a local-first telemedicine learning project built with Expo/React Native and a Node.js microservices backend. Docker is intentionally not used.

## Current local status

- npm-workspaces monorepo configured.
- Expo Router mobile starter created in `apps/mobile`.
- API Gateway has health, development email OTP, JWT access-token, protected current-user, patient/doctor profile, and consultation workflow endpoints in `services/api-gateway`.
- Prisma Postgres is connected for development; user/profile and consultation workflow migrations are in `services/database/prisma/migrations`.
- Mobile screens still use local demo state; frontend API integration, actual file upload, chat, and notifications are next.

Every backend service follows the same simple `routes → controllers → models → app.ts → server.ts` structure. See [backend architecture](docs/backend-architecture.md).

Read [the local setup guide](docs/local-setup.md) before running the project.
