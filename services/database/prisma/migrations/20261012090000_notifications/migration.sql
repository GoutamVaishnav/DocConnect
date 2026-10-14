-- Store the purpose and related consultation for every notification.
CREATE TYPE "NotificationType" AS ENUM (
  'CONSULTATION_REQUEST',
  'CONSULTATION_ACCEPTED',
  'CONSULTATION_COMPLETED',
  'CHAT_MESSAGE'
);

CREATE TYPE "DevicePlatform" AS ENUM ('ANDROID', 'IOS');

-- Existing notification rows were created by the chat feature, so backfill them
-- with CHAT_MESSAGE before enforcing the required column.
ALTER TABLE "notifications"
  ADD COLUMN "consultation_id" UUID,
  ADD COLUMN "type" "NotificationType" NOT NULL DEFAULT 'CHAT_MESSAGE';

ALTER TABLE "notifications" ALTER COLUMN "type" DROP DEFAULT;

CREATE INDEX "notifications_consultation_id_idx" ON "notifications"("consultation_id");

ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_consultation_id_fkey"
  FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "device_push_tokens" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "token" TEXT NOT NULL,
  "platform" "DevicePlatform" NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "device_push_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "device_push_tokens_token_key" ON "device_push_tokens"("token");
CREATE INDEX "device_push_tokens_user_id_idx" ON "device_push_tokens"("user_id");

ALTER TABLE "device_push_tokens"
  ADD CONSTRAINT "device_push_tokens_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
