-- Internal log of regulator outreach (emails, calls) and feedback — operational, not a legal record.

CREATE TABLE "compliance_regulator_correspondence" (
    "id" TEXT NOT NULL,
    "regulator_key" VARCHAR(64) NOT NULL,
    "channel" VARCHAR(32) NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'draft',
    "subject" VARCHAR(512),
    "outbound_summary" TEXT,
    "inbound_summary" TEXT,
    "feedback_notes" TEXT,
    "recommendations" TEXT,
    "occurred_at" TIMESTAMP(3),
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "compliance_regulator_correspondence_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "compliance_regulator_correspondence_regulator_key_created_at_idx" ON "compliance_regulator_correspondence"("regulator_key", "created_at" DESC);

ALTER TABLE "compliance_regulator_correspondence" ADD CONSTRAINT "compliance_regulator_correspondence_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
