import type { RequestHandler } from 'express';

import { HealthModel } from '../models/health.model.js';

export function createHealthController(healthModel = new HealthModel()): { getHealth: RequestHandler } {
  return {
    getHealth: (_request, response) => {
      response.status(200).json(healthModel.getStatus());
    },
  };
}
