-- What-if marketplace simulation sandbox (admin) — no live marketplace writes from this table.

CREATE TABLE "lecipm_what_if_scenarios" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region_key" VARCHAR(64),
    "params" JSONB NOT NULL,
    "is_recommended" BOOLEAN NOT NULL DEFAULT false,
    "last_result_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_what_if_scenarios_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_what_if_scenarios_user_id_created_at_idx" ON "lecipm_what_if_scenarios"("user_id", "created_at");

ALTER TABLE "lecipm_what_if_scenarios" ADD CONSTRAINT "lecipm_what_if_scenarios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
