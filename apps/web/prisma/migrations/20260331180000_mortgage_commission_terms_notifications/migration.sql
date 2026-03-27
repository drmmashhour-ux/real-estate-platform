-- Mortgage expert terms, in-app notifications, closed-deal commission tracking

ALTER TABLE "mortgage_experts" ADD COLUMN IF NOT EXISTS "accepted_terms" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "mortgage_experts" ADD COLUMN IF NOT EXISTS "accepted_at" TIMESTAMP(3);
ALTER TABLE "mortgage_experts" ADD COLUMN IF NOT EXISTS "commission_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.30;
ALTER TABLE "mortgage_experts" ADD COLUMN IF NOT EXISTS "notifications_last_read_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "mortgage_experts_accepted_terms_idx" ON "mortgage_experts"("accepted_terms");

-- Experts already in DB before this feature: grandfather terms acceptance (new signups default false in app)
UPDATE "mortgage_experts"
SET
  "accepted_terms" = true,
  "accepted_at" = COALESCE("accepted_at", "created_at", CURRENT_TIMESTAMP)
WHERE "accepted_terms" = false;

CREATE TABLE IF NOT EXISTS "mortgage_deals" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "expert_id" TEXT NOT NULL,
    "deal_amount" INTEGER NOT NULL,
    "platform_share" INTEGER NOT NULL,
    "expert_share" INTEGER NOT NULL,
    "commission_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.30,
    "status" TEXT NOT NULL DEFAULT 'closed',
    "admin_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mortgage_deals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "mortgage_deals_lead_id_key" ON "mortgage_deals"("lead_id");
CREATE INDEX IF NOT EXISTS "mortgage_deals_expert_id_idx" ON "mortgage_deals"("expert_id");
CREATE INDEX IF NOT EXISTS "mortgage_deals_status_idx" ON "mortgage_deals"("status");

ALTER TABLE "mortgage_deals" DROP CONSTRAINT IF EXISTS "mortgage_deals_lead_id_fkey";
ALTER TABLE "mortgage_deals" ADD CONSTRAINT "mortgage_deals_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "mortgage_deals" DROP CONSTRAINT IF EXISTS "mortgage_deals_expert_id_fkey";
ALTER TABLE "mortgage_deals" ADD CONSTRAINT "mortgage_deals_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "mortgage_experts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "expert_in_app_notifications" (
    "id" TEXT NOT NULL,
    "expert_id" TEXT NOT NULL,
    "lead_id" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'mortgage_lead',
    "title" TEXT NOT NULL,
    "body" TEXT,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expert_in_app_notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "expert_in_app_notifications_expert_id_read_at_idx" ON "expert_in_app_notifications"("expert_id", "read_at");
CREATE INDEX IF NOT EXISTS "expert_in_app_notifications_expert_id_created_at_idx" ON "expert_in_app_notifications"("expert_id", "created_at");

ALTER TABLE "expert_in_app_notifications" DROP CONSTRAINT IF EXISTS "expert_in_app_notifications_expert_id_fkey";
ALTER TABLE "expert_in_app_notifications" ADD CONSTRAINT "expert_in_app_notifications_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "mortgage_experts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
