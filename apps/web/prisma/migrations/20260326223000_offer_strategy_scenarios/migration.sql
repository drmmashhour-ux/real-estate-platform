-- Saved Offer Strategy Simulator scenarios (LECIPM Case Command Center)

CREATE TABLE "offer_strategy_scenarios" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "case_id" TEXT,
    "user_id" TEXT NOT NULL,
    "scenario_label" TEXT NOT NULL,
    "input_payload" JSONB NOT NULL,
    "output_payload" JSONB NOT NULL,
    "selected" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "offer_strategy_scenarios_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "offer_strategy_scenarios_property_id_idx" ON "offer_strategy_scenarios"("property_id");
CREATE INDEX "offer_strategy_scenarios_case_id_idx" ON "offer_strategy_scenarios"("case_id");
CREATE INDEX "offer_strategy_scenarios_user_id_idx" ON "offer_strategy_scenarios"("user_id");
CREATE INDEX "offer_strategy_scenarios_selected_idx" ON "offer_strategy_scenarios"("selected");
CREATE INDEX "offer_strategy_scenarios_created_at_idx" ON "offer_strategy_scenarios"("created_at" DESC);

ALTER TABLE "offer_strategy_scenarios" ADD CONSTRAINT "offer_strategy_scenarios_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "offer_strategy_scenarios" ADD CONSTRAINT "offer_strategy_scenarios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
