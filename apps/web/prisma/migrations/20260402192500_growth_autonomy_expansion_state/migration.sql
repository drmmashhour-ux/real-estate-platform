CREATE TABLE "growth_autonomy_expansion_state" (
    "id" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "freeze" BOOLEAN NOT NULL DEFAULT false,
    "pending_json" JSONB NOT NULL DEFAULT '[]',
    "activated_trials_json" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "growth_autonomy_expansion_state_pkey" PRIMARY KEY ("id")
);
