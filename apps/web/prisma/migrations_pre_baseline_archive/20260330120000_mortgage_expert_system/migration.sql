-- Mortgage expert role + profiles + lead assignment
ALTER TYPE "PlatformRole" ADD VALUE 'MORTGAGE_EXPERT';

CREATE TABLE "mortgage_experts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "photo" TEXT,
    "company" TEXT,
    "license_number" TEXT,
    "title" TEXT,
    "bio" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "dashboard_last_seen_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mortgage_experts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "mortgage_experts_user_id_key" ON "mortgage_experts"("user_id");
CREATE INDEX "mortgage_experts_is_active_idx" ON "mortgage_experts"("is_active");

ALTER TABLE "mortgage_experts" ADD CONSTRAINT "mortgage_experts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Lead" ADD COLUMN "lead_type" TEXT;
ALTER TABLE "Lead" ADD COLUMN "assigned_expert_id" TEXT;
ALTER TABLE "Lead" ADD COLUMN "mortgage_inquiry" JSONB;

CREATE INDEX "Lead_lead_type_idx" ON "Lead"("lead_type");
CREATE INDEX "Lead_assigned_expert_id_idx" ON "Lead"("assigned_expert_id");

ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assigned_expert_id_fkey" FOREIGN KEY ("assigned_expert_id") REFERENCES "mortgage_experts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'crm_conversations'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'crm_conversations_expert_id_fkey'
  ) THEN
    ALTER TABLE "crm_conversations" ADD CONSTRAINT "crm_conversations_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "mortgage_experts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
