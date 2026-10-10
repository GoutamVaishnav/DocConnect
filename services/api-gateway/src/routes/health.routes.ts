import { Router } from 'express';

import { createHealthController } from '../controllers/health.controller.js';

export function createHealthRouter() {
  const router = Router();
  const healthController = createHealthController();

  router.get('/', healthController.getHealth);

  return router;
}
