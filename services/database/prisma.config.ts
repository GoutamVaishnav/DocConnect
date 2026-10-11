import 'dotenv/config';

import { defineConfig, env } from 'prisma/config';

// Prisma CLI commands must prefer a direct database connection. The fallback keeps
// the initial development setup working until DIRECT_URL is added in Prisma Console.
const migrationDatabaseUrl = process.env.DIRECT_URL || env('DATABASE_URL');

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: migrationDatabaseUrl,
  },
});
