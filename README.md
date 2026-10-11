# DocConnect

DocConnect is a local-first telemedicine learning project built with Expo/React Native and a Node.js microservices backend. Docker is intentionally not used.

## Current local status

- npm-workspaces monorepo configured.
- Expo Router mobile starter created in `apps/mobile`.
- API Gateway has health, development or SMTP email OTP delivery, JWT access-token, patient/doctor profile, consultation workflow, protected Cloudinary image upload, and active-consultation chat endpoints in `services/api-gateway`.
- Prisma Postgres is connected for development; user/profile and consultation workflow migrations are in `services/database/prisma/migrations`.
- Mobile authentication is connected to the API Gateway: email OTP request/verify, encrypted native session storage, role-aware protected routes, registration profile creation, and logout are ready. Other patient/doctor screens still use their local UI state until their respective API integrations are added.

Every backend service follows the same simple `routes → controllers → models → app.ts → server.ts` structure. See [backend architecture](docs/backend-architecture.md).

Read [the local setup guide](docs/local-setup.md) before running the project.

## Fast Windows start

Double-click [start-docconnect.cmd](start-docconnect.cmd). It opens one terminal for the API Gateway and one for Expo without relying on the current PowerShell `PATH`.

You can also run only one part by double-clicking [run-gateway.cmd](run-gateway.cmd) or [run-mobile.cmd](run-mobile.cmd).
