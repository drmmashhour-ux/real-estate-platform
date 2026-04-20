-- CreateTable
CREATE TABLE "autonomy_configs" (
    "id" TEXT NOT NULL,
    "scope_type" VARCHAR(24) NOT NULL,
    "scope_id" TEXT NOT NULL,
    "mode" VARCHAR(32) NOT NULL DEFAULT 'ASSIST',
    "auto_pricing" BOOLEAN NOT NULL DEFAULT true,
    "auto_promotions" BOOLEAN NOT NULL DEFAULT false,
    "auto_messaging" BOOLEAN NOT NULL DEFAULT false,
    "auto_listing_optimization" BOOLEAN NOT NULL DEFAULT true,
    "max_price_change_pct" DOUBLE PRECISION,
    "max_discount_pct" DOUBLE PRECISION,
    "min_occupancy_threshold" DOUBLE PRECISION,
    "anomaly_drop_threshold" DOUBLE PRECISION,
    "quiet_hours_start_utc" INTEGER,
    "quiet_hours_end_utc" INTEGER,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "autonomy_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autonomy_actions" (
    "id" TEXT NOT NULL,
    "scope_type" VARCHAR(24) NOT NULL,
    "scope_id" TEXT NOT NULL,
    "domain" VARCHAR(32) NOT NULL,
    "action_type" VARCHAR(48) NOT NULL,
    "payload_json" JSONB NOT NULL,
    "status" VARCHAR(24) NOT NULL,
    "reason" TEXT,
    "confidence" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executed_at" TIMESTAMP(3),

    CONSTRAINT "autonomy_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autonomy_event_logs" (
    "id" TEXT NOT NULL,
    "scope_type" VARCHAR(24) NOT NULL,
    "scope_id" TEXT NOT NULL,
    "event_type" VARCHAR(32) NOT NULL,
    "message" TEXT,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "autonomy_event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "autonomy_configs_scope_type_scope_id_key" ON "autonomy_configs"("scope_type", "scope_id");

-- CreateIndex
CREATE INDEX "autonomy_configs_scope_type_scope_id_idx" ON "autonomy_configs"("scope_type", "scope_id");

-- CreateIndex
CREATE INDEX "autonomy_actions_scope_type_scope_id_created_at_idx" ON "autonomy_actions"("scope_type", "scope_id", "created_at");

-- CreateIndex
CREATE INDEX "autonomy_event_logs_scope_type_scope_id_created_at_idx" ON "autonomy_event_logs"("scope_type", "scope_id", "created_at");
