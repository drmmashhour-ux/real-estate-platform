-- Guided first-transaction playbook per deal (synced from deal signals)

CREATE TABLE "deal_playbooks" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "current_step" VARCHAR(48) NOT NULL,
    "completed_steps" JSONB NOT NULL DEFAULT '[]',
    "next_action" TEXT NOT NULL,
    "progress_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tracking_snapshot" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_playbooks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "deal_playbooks_deal_id_key" ON "deal_playbooks"("deal_id");
CREATE INDEX "deal_playbooks_deal_id_idx" ON "deal_playbooks"("deal_id");

ALTER TABLE "deal_playbooks" ADD CONSTRAINT "deal_playbooks_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
