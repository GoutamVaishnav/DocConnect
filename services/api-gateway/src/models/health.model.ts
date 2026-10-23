import { getPrismaClient } from '@docconnect/database';

export type HealthStatus = {
  database: 'connected' | 'not-connected';
  service: 'api-gateway';
  status: 'degraded' | 'ok';
  timestamp: string;
  version: string;
};

export class HealthModel {
  async getStatus(): Promise<HealthStatus> {
    try {
      // A tiny query confirms that the same Prisma connection used by the API
      // can reach the configured database.
      await getPrismaClient().$queryRaw`SELECT 1`;

      return {
        database: 'connected',
        service: 'api-gateway',
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '0.1.0',
      };
    } catch {
      return {
        database: 'not-connected',
        service: 'api-gateway',
        status: 'degraded',
        timestamp: new Date().toISOString(),
        version: '0.1.0',
      };
    }
  }
}
