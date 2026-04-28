-- First-10 broker acquisition CRM (operator outreach)
CREATE TABLE "broker_prospects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "agency" TEXT,
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "status" TEXT NOT NULL DEFAULT 'new',
    "notes" TEXT,
    "linked_broker_user_id" TEXT,
    "first_purchase_at" TIMESTAMP(3),
    "total_spent_cents" INTEGER NOT NULL DEFAULT 0,
    "demo_lead_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broker_prospects_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "broker_prospects_email_idx" ON "broker_prospects"("email");
CREATE INDEX "broker_prospects_status_idx" ON "broker_prospects"("status");

ALTER TABLE "broker_prospects" ADD CONSTRAINT "broker_prospects_linked_broker_user_id_fkey" FOREIGN KEY ("linked_broker_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
