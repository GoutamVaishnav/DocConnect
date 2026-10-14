# API Gateway (local development)

Base URL: `http://localhost:3000`

The gateway source is intentionally split into simple folders: `routes`, `controllers`, `models`, `middlewares`, `app.ts`, and `server.ts`. See [backend architecture](backend-architecture.md).

## Available endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Gateway health status |
| `GET` | `/api/v1` | API version check |
| `POST` | `/api/v1/auth/email-otp/request` | Generate and deliver an OTP for a patient or doctor email |
| `POST` | `/api/v1/auth/email-otp/verify` | Verify an OTP and receive a JWT access token |
| `GET` | `/api/v1/auth/me` | Return the authenticated user from a Bearer token |
| `GET` | `/api/v1/profile/me` | Return the current patient's or doctor's profile |
| `PUT` | `/api/v1/profile/patient` | Create or update the current patient's profile |
| `PUT` | `/api/v1/profile/doctor` | Create or update the current doctor's profile |
| `PATCH` | `/api/v1/profile/doctor/availability` | Enable or disable the current doctor's availability |
| `POST` | `/api/v1/consultations` | Create a consultation request as a patient |
| `GET` | `/api/v1/consultations/:consultationId/messages` | Read messages in an active consultation chat |
| `POST` | `/api/v1/consultations/:consultationId/messages` | Send a text and/or attachment in an active consultation chat |
| `PATCH` | `/api/v1/consultations/:consultationId/messages/read` | Mark the other participant's delivered messages as seen |
| `POST` | `/api/v1/consultations/:consultationId/images` | Upload a patient consultation image to Cloudinary |
| `GET` | `/api/v1/consultations/:consultationId/images/:attachmentId/delivery-url` | Get a short-lived download URL for an authorised consultation image |
| `DELETE` | `/api/v1/consultations/:consultationId/images/:attachmentId` | Remove a patient image while the consultation is pending |
| `GET` | `/api/v1/consultations/my` | List the current user's consultations |
| `GET` | `/api/v1/consultations/open` | List unassigned pending requests as a doctor |
| `GET` | `/api/v1/consultations/:consultationId` | Read an available consultation's details |
| `PATCH` | `/api/v1/consultations/:consultationId/accept` | Accept a pending request as an available doctor |
| `PATCH` | `/api/v1/consultations/:consultationId/decline` | Hide a pending request from the current doctor's open list |
| `PATCH` | `/api/v1/consultations/:consultationId/complete` | Complete the assigned consultation with its summary |
| `PATCH` | `/api/v1/consultations/:consultationId/cancel` | Cancel a pending request as its patient |
| `GET` | `/api/v1/notifications` | List the authenticated user's notification history |
| `PATCH` | `/api/v1/notifications/read-all` | Mark all authenticated user's notifications as read |
| `PATCH` | `/api/v1/notifications/:notificationId/read` | Mark one notification as read |
| `POST` | `/api/v1/notifications/push-tokens` | Register the current device's Expo push token |
| `DELETE` | `/api/v1/notifications/push-tokens` | Remove the current device's Expo push token |

### Request an OTP

```json
{
  "email": "rohan@example.com",
  "role": "PATIENT"
}
```

With `OTP_DELIVERY_MODE=development`, the response includes `developmentCode` for local testing. No email is sent. With `OTP_DELIVERY_MODE=smtp`, the gateway sends the code through the configured SMTP provider and the response never contains the code. The code expires in ten minutes, requests have a sixty-second cooldown, and verification permits five attempts.

### Verify an OTP

```json
{
  "email": "rohan@example.com",
  "role": "PATIENT",
  "code": "123456"
}
```

The success response contains `accessToken`, `tokenType: "Bearer"`, and the authenticated user. Send that token with protected routes:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## Profile endpoints

All profile endpoints require a Bearer access token. A patient cannot call doctor endpoints, and a doctor cannot call patient endpoints.

### Save a patient profile

`PUT /api/v1/profile/patient`

```json
{
  "fullName": "Rohan Sharma",
  "dateOfBirth": "1998-04-15"
}
```

`dateOfBirth` is optional and must be a past date in `YYYY-MM-DD` format.

### Save a doctor profile

`PUT /api/v1/profile/doctor`

```json
{
  "fullName": "Dr. Mehta",
  "specialty": "Dermatology",
  "registrationNumber": "MH-12345"
}
```

`registrationNumber` is optional but, when provided, must be unique. Doctors start with `verificationStatus: "PENDING"`; this endpoint cannot self-verify a doctor.

### Change doctor availability

`PATCH /api/v1/profile/doctor/availability`

```json
{
  "enabled": true
}
```

## Consultation endpoints

All consultation endpoints require a Bearer token. The workflow is:

```text
PATIENT creates request → PENDING → available DOCTOR accepts → IN_PROGRESS → assigned DOCTOR completes → COMPLETED
```

The patient may cancel only while the request is `PENDING`. A doctor must create a profile and enable availability before accepting a request. Doctor verification enforcement will be added with the admin verification flow.

### Create a consultation request

`POST /api/v1/consultations` — patient only.

```json
{
  "concernTitle": "Skin rash",
  "symptoms": "Red itchy rash on both hands for two days.",
  "durationText": "2 days",
  "severity": "MODERATE",
  "photoUrls": ["https://example.com/skin-photo.jpg"]
}
```

- `severity` is optional: `MILD`, `MODERATE`, or `SEVERE`.
- `photoUrls` is optional; a maximum of five HTTP/HTTPS URLs is accepted only for backwards compatibility. New mobile code should create the consultation first, then use the Cloudinary image-upload endpoint below.

### Upload a consultation image

`POST /api/v1/consultations/:consultationId/images` — patient only. Send `multipart/form-data` with exactly one `image` field. Only JPEG, PNG, and WebP files up to 10 MB are allowed. A patient can attach up to five images to their own `PENDING` or `IN_PROGRESS` consultation.

The gateway authenticates the patient before performing a **signed server-side** Cloudinary upload. The Cloudinary API secret remains on the gateway and is never sent to the mobile app. Assets use Cloudinary's `authenticated` delivery type; the database records metadata and the Cloudinary public ID, not a public source URL.

### Retrieve an image delivery URL

`GET /api/v1/consultations/:consultationId/images/:attachmentId/delivery-url`

The patient who owns the consultation, its assigned doctor, or a doctor viewing an available open request may call this endpoint. It returns a Cloudinary signed URL valid for five minutes. Do not store the returned delivery URL permanently in the mobile app.

### Remove an image before a doctor accepts the request

`DELETE /api/v1/consultations/:consultationId/images/:attachmentId` — patient only.

The endpoint deletes the authenticated Cloudinary asset and its attachment record. It works only while the consultation remains `PENDING`, protecting the record once a doctor has accepted it.

### List consultations

`GET /api/v1/consultations/my?status=IN_PROGRESS&limit=20`

Patients receive their own consultations. Doctors receive only consultations assigned to them. `status` and `limit` are optional; `limit` can be `1` to `50`.

`GET /api/v1/consultations/open` is doctor-only and returns unassigned `PENDING` requests.

### Consultation chat messages

Chat is available only while a consultation is `IN_PROGRESS`. Only the patient who created the consultation and its assigned doctor can read or send messages. Other doctors, including doctors who can view an open request, cannot access the chat.

`POST /api/v1/consultations/:consultationId/messages`

```json
{
  "body": "The rash started two days ago and is getting itchy."
}
```

Send this endpoint as either JSON (for text-only messages) or `multipart/form-data` (when attaching a file). `body` is optional for an attachment-only message and may contain up to 2,000 characters. The multipart field name is `attachment`.

- Images: JPEG, PNG, and WebP.
- Documents: PDF, DOC, DOCX, and TXT.
- Maximum size: 10 MB per attachment.

Chat attachment uploads go through the authenticated gateway to Cloudinary. The app receives a short-lived signed delivery URL; it does not receive the Cloudinary API secret or persistent public asset ID. A new in-app notification record is created for the other participant without including the message text.

`PATCH /api/v1/consultations/:consultationId/messages/read` has no body. It marks messages sent by the other participant as read and emits a Socket.IO `chat:read` event to the conversation. The sender can then show **Seen**.

While a user is writing, the app sends the transient Socket.IO event `chat:typing`. This is not stored in the database; it is broadcast only to the other active participant and automatically stops shortly after typing ends.

## Notifications

All notification endpoints require a Bearer access token. The gateway creates a notification for:

- available doctors when a patient submits a consultation;
- the patient when a doctor accepts or completes a consultation; and
- the other participant when a chat message is sent.

The notification body deliberately excludes symptom details and message text, so push banners do not expose clinical information on a lock screen.

`GET /api/v1/notifications?limit=30&cursor=NOTIFICATION_ID` returns newest notifications first. `limit` is optional and must be between `1` and `50`.

### Register an Expo device token

`POST /api/v1/notifications/push-tokens`

```json
{
  "token": "ExponentPushToken[example-token]",
  "platform": "ANDROID"
}
```

The mobile app calls this automatically after a physical-device EAS build receives notification permission. The server sends through Expo's push service and removes tokens that Expo reports as no longer registered. In-app updates use Socket.IO and work independently of push permissions.

`GET /api/v1/consultations/:consultationId/messages?limit=30&cursor=MESSAGE_ID`

- `limit` is optional and can be `1` to `50` (default `30`).
- The response returns messages in chronological order and `nextCursor` when older messages are available.
- Send `nextCursor` back as `cursor` to retrieve the next older page.

### Accept a request

`PATCH /api/v1/consultations/:consultationId/accept` — doctor only, with no body.

The update is concurrency-safe: only one doctor can change a pending request into `IN_PROGRESS`.

### Decline a request

`PATCH /api/v1/consultations/:consultationId/decline` — doctor only.

```json
{
  "reason": "Outside current specialty availability."
}
```

`reason` is optional. A decline hides the request only for that doctor; it remains open for other doctors and is not cancelled for the patient.

### Complete a consultation

`PATCH /api/v1/consultations/:consultationId/complete` — assigned doctor only.

```json
{
  "doctorNotes": "The photos suggest a mild skin irritation. No urgent signs are visible.",
  "careInstructions": "Apply the prescribed cream twice daily and keep the skin clean and dry.",
  "prescriptionUrl": "https://example.com/prescription.pdf"
}
```

`doctorNotes` is required. The other fields are optional and their real file upload/storage integration is a later step.

### Required Gateway environment values

```env
DATABASE_URL="pooled-prisma-postgres-url"
JWT_ACCESS_SECRET="long-random-secret"
JWT_ACCESS_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
OTP_DELIVERY_MODE=smtp
SMTP_HOST="smtp.your-provider.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-smtp-username"
SMTP_PASSWORD="your-smtp-password-or-app-password"
SMTP_FROM="DocConnect <no-reply@your-domain.com>"
# Optional: required only when Expo enhanced push security is enabled.
EXPO_PUSH_ACCESS_TOKEN=""
```

When SMTP mode is enabled, gateway startup calls the provider's SMTP verification step before it begins accepting requests. Use `SMTP_SECURE=true` with an implicit TLS port (normally `465`), or `false` with STARTTLS on port `587`. Do not put any SMTP value in the Expo/mobile app. For real patient health data, ensure your Cloudinary plan/configuration and broader hosting/security design meet the compliance obligations that apply to your deployment.
