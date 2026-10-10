export type HealthStatus = {
  database: 'not-connected';
  service: 'api-gateway';
  status: 'ok';
  timestamp: string;
  version: string;
};

// A model holds data-related logic. Database checking will be added here later.
export class HealthModel {
  getStatus(): HealthStatus {
    return {
      database: 'not-connected',
      service: 'api-gateway',
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
    };
  }
}
