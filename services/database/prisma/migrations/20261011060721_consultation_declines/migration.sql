-- CreateTable
CREATE TABLE "consultation_declines" (
    "id" UUID NOT NULL,
    "consultation_id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultation_declines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "consultation_declines_doctor_id_created_at_idx" ON "consultation_declines"("doctor_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "consultation_declines_consultation_id_doctor_id_key" ON "consultation_declines"("consultation_id", "doctor_id");

-- AddForeignKey
ALTER TABLE "consultation_declines" ADD CONSTRAINT "consultation_declines_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_declines" ADD CONSTRAINT "consultation_declines_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
