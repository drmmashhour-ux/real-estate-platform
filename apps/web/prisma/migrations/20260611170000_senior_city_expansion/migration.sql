-- CreateTable
CREATE TABLE "senior_cities" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "country" VARCHAR(80) NOT NULL,
    "status" VARCHAR(24) NOT NULL DEFAULT 'LOCKED',
    "operator_count" INTEGER NOT NULL DEFAULT 0,
    "lead_count" INTEGER NOT NULL DEFAULT 0,
    "conversion_rate" DOUBLE PRECISION,
    "demand_score" DOUBLE PRECISION,
    "supply_score" DOUBLE PRECISION,
    "readiness_score" DOUBLE PRECISION,
    "lead_growth_rate" DOUBLE PRECISION,
    "expansion_weights_json" JSONB,
    "expansion_cloned_from_city" VARCHAR(160),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "senior_cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "senior_expansion_tasks" (
    "id" TEXT NOT NULL,
    "city_id" VARCHAR(36) NOT NULL,
    "task_type" VARCHAR(48) NOT NULL,
    "status" VARCHAR(24) NOT NULL DEFAULT 'PENDING',
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "senior_expansion_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "senior_cities_name_country_key" ON "senior_cities"("name", "country");

-- CreateIndex
CREATE INDEX "senior_cities_country_status_idx" ON "senior_cities"("country", "status");

-- CreateIndex
CREATE INDEX "senior_cities_readiness_score_idx" ON "senior_cities"("readiness_score" DESC);

-- CreateIndex
CREATE INDEX "senior_expansion_tasks_city_id_status_idx" ON "senior_expansion_tasks"("city_id", "status");

-- CreateIndex
CREATE INDEX "senior_expansion_tasks_task_type_status_idx" ON "senior_expansion_tasks"("task_type", "status");

-- AddForeignKey
ALTER TABLE "senior_expansion_tasks" ADD CONSTRAINT "senior_expansion_tasks_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "senior_cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
