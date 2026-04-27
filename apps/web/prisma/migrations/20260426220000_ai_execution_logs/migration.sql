-- Autonomous action execution log + rate-limit support (append-only, additive).

CREATE TABLE "ai_execution_logs" (
    "id" TEXT NOT NULL,
    "listing_id" VARCHAR(32),
    "action" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_execution_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_execution_logs_listing_id_created_at_idx" ON "ai_execution_logs"("listing_id", "created_at");
