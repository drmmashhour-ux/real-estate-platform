-- Territory War Room operator state per territory.

CREATE TABLE "lecipm_territory_war_room_state" (
    "territory_id" VARCHAR(64) NOT NULL,
    "phase_override" VARCHAR(24),
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "scaling" BOOLEAN NOT NULL DEFAULT false,
    "expansion_plan_note" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by_user_id" TEXT,

    CONSTRAINT "lecipm_territory_war_room_state_pkey" PRIMARY KEY ("territory_id")
);
