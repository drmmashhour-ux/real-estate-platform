-- CreateTable
CREATE TABLE "acquisition_analyses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "title" TEXT,
    "location" TEXT,
    "purchase_price" DOUBLE PRECISION NOT NULL,
    "estimated_adr" DOUBLE PRECISION NOT NULL,
    "estimated_occupancy" DOUBLE PRECISION NOT NULL,
    "operating_cost_monthly" DOUBLE PRECISION NOT NULL,
    "financing_rate" DOUBLE PRECISION,
    "down_payment" DOUBLE PRECISION,
    "results_json" JSONB,
    "scenarios_json" JSONB,
    "recommendation" VARCHAR(24) NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "confidence_score" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "acquisition_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "acquisition_analyses_user_id_created_at_idx" ON "acquisition_analyses"("user_id", "created_at");
