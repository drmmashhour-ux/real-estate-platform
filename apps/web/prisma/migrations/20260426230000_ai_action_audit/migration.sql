-- Autonomy policy/plan/execute audit (additive).

CREATE TABLE "ai_action_audits" (
    "id" TEXT NOT NULL,
    "listing_id" VARCHAR(32),
    "flags" JSONB,
    "decision" JSONB,
    "actions" JSONB,
    "executed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_action_audits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_action_audits_listing_id_created_at_idx" ON "ai_action_audits"("listing_id", "created_at");
