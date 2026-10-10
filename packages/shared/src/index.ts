/** Roles recognised by DocConnect services. */
export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';

/** Names used when services identify themselves in logs and health checks. */
export type ServiceName =
  | 'api-gateway'
  | 'auth-service'
  | 'user-service'
  | 'consultation-service'
  | 'messaging-service'
  | 'notification-service';
