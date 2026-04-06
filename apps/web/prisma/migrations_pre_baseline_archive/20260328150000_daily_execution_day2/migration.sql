-- Day 2: reply tracking, DM variants, outreach coaching stage on Lead.

CREATE TABLE "daily_metrics" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "metric_date" DATE NOT NULL,
    "messages_sent" INTEGER NOT NULL DEFAULT 0,
    "replies_received" INTEGER NOT NULL DEFAULT 0,
    "calls_booked" INTEGER NOT NULL DEFAULT 0,
    "users_onboarded" INTEGER NOT NULL DEFAULT 0,
    "variant_stats" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_metrics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_daily_metrics_user_date" ON "daily_metrics"("user_id", "metric_date");
CREATE INDEX "idx_daily_metrics_user_date" ON "daily_metrics"("user_id", "metric_date");

ALTER TABLE "daily_metrics" ADD CONSTRAINT "daily_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "dm_scripts" (
    "id" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "performance_score" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dm_scripts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "dm_scripts_variant_key" ON "dm_scripts"("variant");

INSERT INTO "dm_scripts" ("id", "variant", "body", "performance_score", "created_at", "updated_at") VALUES
(
    'dm_seed_curiosity',
    'curiosity',
    'Hey — quick curiosity question.

I''m building an AI workspace for brokers that maps the next best action in live deals (without replacing your judgment).

Open to a 15-min peek this week?',
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'dm_seed_problem',
    'problem_focused',
    'Hey — most brokers I talk to are losing time on unclear next steps once a deal gets moving.

We built LECIPM to cut costly mistakes and keep decisions structured.

Worth a 15-min look?',
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'dm_seed_direct',
    'direct_value',
    'Hey — quick ask.

LECIPM is an AI-assisted broker workspace: deal guidance, checklists, and step-by-step decision support.

If you want a 15–20 min demo, I''ll keep it tight.',
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

ALTER TABLE "Lead" ADD COLUMN "outreach_coaching_stage" TEXT;
CREATE INDEX "Lead_outreach_coaching_stage_idx" ON "Lead"("outreach_coaching_stage");
