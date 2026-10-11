# DocConnect database

This package holds the shared Prisma schema and the generated, type-safe database client. The cloud database is Prisma Postgres; a local PostgreSQL installation is not required.

## Structure

```text
prisma/schema.prisma        Database models and enums
prisma/migrations/          Version-controlled migration files
src/client.ts               Shared Prisma Client singleton
schema/001_initial.sql      Original SQL reference (do not execute alongside Prisma migrations)
```

## Environment variables

Create `services/database/.env` from `.env.example`.

- `DATABASE_URL` is the pooled URL for runtime queries.
- `DIRECT_URL` is the direct URL for Prisma migrations and Studio. Add it from Prisma Console before the next schema change.

## Commands

```powershell
npm run generate --workspace @docconnect/database
npm run migrate:dev --workspace @docconnect/database -- --name describe_change
npm run migrate:deploy --workspace @docconnect/database
npm run studio --workspace @docconnect/database
```

The migrations create users, role-specific profiles, email OTP challenges, consultation workflow/summary fields, messages, and notifications. No production medical data belongs in this repository.
