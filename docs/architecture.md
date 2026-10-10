# Phase 1 architecture

```text
Expo mobile app
      |
      | HTTP (later: authenticated API calls)
      v
API Gateway :3000
      |
      +-- Auth Service :3001                 (Phase 3)
      +-- User Service :3002                 (Phase 4)
      +-- Consultation Service :3003         (Phase 5)
      +-- Messaging Service :3004            (Phase 8)
      +-- Notification Service :3005         (Phase 9)

Each future service owns its own PostgreSQL database on the same local server.
```

Only the mobile app and gateway exist in Phase 1. The gateway has no medical or authentication business logic yet; it only provides a safe entry point and a health check.

The shared package is deliberately small. It will hold stable cross-service types and constants, never a shared database client or service business logic.
