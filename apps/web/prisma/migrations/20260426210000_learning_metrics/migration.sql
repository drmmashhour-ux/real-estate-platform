-- Outcome-driven weights (A/B learn loop) — additive table; safe to deploy empty.

CREATE TABLE "learning_metrics" (
    "id" TEXT NOT NULL,
    "key" VARCHAR(256) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_metrics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "learning_metrics_key_key" ON "learning_metrics"("key");
