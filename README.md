# DocConnect

DocConnect is a local-first telemedicine learning project built with Expo/React Native and a Node.js microservices backend. Docker is intentionally not used.

## Current local status

- npm-workspaces monorepo configured.
- Expo Router mobile starter created in `apps/mobile`.
- API Gateway has health and development-only email OTP endpoints in `services/api-gateway`.
- PostgreSQL schema is prepared in `services/database/schema/001_initial.sql` but is not connected or migrated yet.
- Mobile screens use local demo state; real authentication, medical data, chat, and notifications are not connected yet.

Every backend service follows the same simple `routes → controllers → models → app.ts → server.ts` structure. See [backend architecture](docs/backend-architecture.md).

Read [the local setup guide](docs/local-setup.md) before running the project.
