-- AlterTable
ALTER TABLE "consultations" ADD COLUMN     "care_instructions" TEXT,
ADD COLUMN     "doctor_notes" TEXT,
ADD COLUMN     "photo_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "prescription_url" TEXT;
