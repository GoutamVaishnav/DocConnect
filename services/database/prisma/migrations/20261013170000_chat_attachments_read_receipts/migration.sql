-- Add persistent read receipts for two-person consultation chats.
ALTER TABLE "consultation_messages"
  ADD COLUMN "read_at" TIMESTAMPTZ(6);

CREATE INDEX "consultation_messages_read_receipt_idx"
  ON "consultation_messages"("consultation_id", "sender_id", "read_at");

-- Store Cloudinary-backed images and files attached to chat messages.
CREATE TYPE "MessageAttachmentKind" AS ENUM ('IMAGE', 'FILE');

CREATE TABLE "consultation_message_attachments" (
  "id" UUID NOT NULL,
  "message_id" UUID NOT NULL,
  "kind" "MessageAttachmentKind" NOT NULL,
  "cloudinary_public_id" TEXT NOT NULL,
  "original_file_name" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL,
  "file_format" TEXT NOT NULL,
  "bytes" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "consultation_message_attachments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "consultation_message_attachments_cloudinary_public_id_key"
  ON "consultation_message_attachments"("cloudinary_public_id");

CREATE INDEX "consultation_message_attachments_timeline_idx"
  ON "consultation_message_attachments"("message_id", "created_at");

ALTER TABLE "consultation_message_attachments"
  ADD CONSTRAINT "consultation_message_attachments_message_id_fkey"
  FOREIGN KEY ("message_id") REFERENCES "consultation_messages"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
