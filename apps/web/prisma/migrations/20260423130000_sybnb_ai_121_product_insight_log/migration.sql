-- ORDER SYBNB-AI-121 — insight history when product intelligence runs

CREATE TABLE "product_insight_logs" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_insight_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_insight_logs_created_at_idx" ON "product_insight_logs"("created_at");
CREATE INDEX "product_insight_logs_type_created_at_idx" ON "product_insight_logs"("type", "created_at");
