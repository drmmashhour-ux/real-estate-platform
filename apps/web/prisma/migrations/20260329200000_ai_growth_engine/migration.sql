-- CreateTable
CREATE TABLE "ai_growth_content_plans" (
    "id" TEXT NOT NULL,
    "plan_date" DATE NOT NULL,
    "topic" TEXT NOT NULL,
    "summary" TEXT,
    "plan_json" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ai_growth_content_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_growth_content_items" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "scheduled_at" TIMESTAMPTZ(6),
    "published_at" TIMESTAMPTZ(6),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "payload_json" JSONB NOT NULL,
    "human_approved_at" TIMESTAMPTZ(6),
    "human_approved_by_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ai_growth_content_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_growth_performance_snapshots" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "snapshot_date" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "engagement_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "raw_json" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_growth_performance_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_ai_growth_plans_plan_date" ON "ai_growth_content_plans"("plan_date");

-- CreateIndex
CREATE INDEX "idx_ai_growth_items_plan_id" ON "ai_growth_content_items"("plan_id");

-- CreateIndex
CREATE INDEX "idx_ai_growth_items_status" ON "ai_growth_content_items"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_ai_growth_perf_item_date" ON "ai_growth_performance_snapshots"("item_id", "snapshot_date");

-- AddForeignKey
ALTER TABLE "ai_growth_content_items" ADD CONSTRAINT "ai_growth_content_items_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "ai_growth_content_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_growth_performance_snapshots" ADD CONSTRAINT "ai_growth_performance_snapshots_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "ai_growth_content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
