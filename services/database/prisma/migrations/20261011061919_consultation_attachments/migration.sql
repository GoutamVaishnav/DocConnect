-- CreateEnum
CREATE TYPE "ConsultationAttachmentKind" AS ENUM ('PATIENT_IMAGE');

-- CreateTable
CREATE TABLE "consultation_attachments" (
    "id" UUID NOT NULL,
    "consultation_id" UUID NOT NULL,
    "uploaded_by_id" UUID NOT NULL,
    "kind" "ConsultationAttachmentKind" NOT NULL DEFAULT 'PATIENT_IMAGE',
    "cloudinary_public_id" TEXT NOT NULL,
    "original_file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_format" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultation_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "consultation_attachments_cloudinary_public_id_key" ON "consultation_attachments"("cloudinary_public_id");

-- CreateIndex
CREATE INDEX "consultation_attachments_timeline_idx" ON "consultation_attachments"("consultation_id", "kind", "created_at");

-- AddForeignKey
ALTER TABLE "consultation_attachments" ADD CONSTRAINT "consultation_attachments_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_attachments" ADD CONSTRAINT "consultation_attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
