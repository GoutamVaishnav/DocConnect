# Backend architecture

Every DocConnect backend service follows one easy pattern:

```text
service-name/
  src/
    config/          # Reads environment variables
    routes/          # URL and HTTP method only
    controllers/     # Request validation and response handling
    models/          # Database or data-storage logic
    middlewares/     # Shared error/auth middleware
    app.ts           # Builds the Express application
    server.ts         # Starts the service (TypeScript equivalent of server.js)
```

## Request flow

```text
Mobile app → Route → Controller → Model → Database
                              ↓
                         JSON response
```

Keep each layer small:

- **Route:** `POST /email-otp/request` points to one controller function.
- **Controller:** validates the email and decides the HTTP response code.
- **Model:** creates, reads, updates, or deletes stored data. It never knows HTTP details.
- **app.ts:** connects routes and middleware.
- **server.ts:** reads the port and starts Express.

## Services roadmap

| Service | Responsibility | Initial routes |
| --- | --- | --- |
| `api-gateway` | Single public API entry point | health, development auth OTP |
| `auth-service` | Email OTP, sessions, tokens | `/auth/email-otp/*` |
| `user-service` | Patient and doctor profiles | `/users/me`, `/doctors/me` |
| `consultation-service` | Consultation requests and case status | `/consultations` |
| `messaging-service` | Consultation messages | `/consultations/:id/messages` |
| `notification-service` | In-app and push notifications | `/notifications` |

Only `api-gateway` is implemented today. Every new service will use the same folder structure above instead of mixing route, business, and database code in one file.
