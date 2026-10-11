import 'dotenv/config';

import { createApp } from './app.js';
import { env } from './config/env.js';

function requireStartupConfiguration() {
  const missingVariables = [
    ['DATABASE_URL', env.databaseUrl],
    ['JWT_ACCESS_SECRET', env.jwtAccessSecret],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missingVariables.length > 0) {
    throw new Error(`Missing required environment variable(s): ${missingVariables.join(', ')}.`);
  }
}

requireStartupConfiguration();

const app = createApp();

app.listen(env.port, () => {
  console.log(`DocConnect API Gateway is listening on http://localhost:${env.port}`);
});
