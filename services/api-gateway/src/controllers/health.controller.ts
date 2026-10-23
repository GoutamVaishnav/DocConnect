import type { RequestHandler } from 'express';

import { HealthModel } from '../models/health.model.js';

export function createHealthController(healthModel = new HealthModel()): { getHealth: RequestHandler } {
  return {
    getHealth: async (_request, response) => {
      const status = await healthModel.getStatus();
      response.status(status.status === 'ok' ? 200 : 503).json(status);
    },
  };
}
