-- Pre-broker-signature risk assessments (audit)

CREATE TABLE "action_risks" (
    "id" TEXT NOT NULL,
    "action_id" VARCHAR(200) NOT NULL,
    "risk_score" INTEGER NOT NULL,
    "risk_level" VARCHAR(16) NOT NULL,
    "flags_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_risks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "action_risks_action_id_created_at_idx" ON "action_risks"("action_id", "created_at" DESC);
