import 'dotenv/config';

import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

app.listen(env.port, () => {
  console.log(`DocConnect API Gateway is listening on http://localhost:${env.port}`);
});
