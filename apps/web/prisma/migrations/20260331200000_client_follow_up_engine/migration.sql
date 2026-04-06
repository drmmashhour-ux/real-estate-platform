CREATE TABLE "client_interest_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "top_city" TEXT,
    "top_property_type" TEXT,
    "top_intent_mode" TEXT,
    "preferred_price_min_cents" INTEGER,
    "preferred_price_max_cents" INTEGER,
    "interest_score" INTEGER NOT NULL DEFAULT 0,
    "intent_stage" TEXT NOT NULL DEFAULT 'cold',
    "last_active_at" TIMESTAMP(3),
    "computed_from_events_at" TIMESTAMP(3),
    "summaryJson" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_interest_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "client_celebration_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "birth_date" TIMESTAMP(3),
    "allow_birthday_touch" BOOLEAN NOT NULL DEFAULT false,
    "last_birthday_sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_celebration_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "client_follow_up_queue" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "payload" JSONB,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "sent_at" TIMESTAMP(3),
    "last_error" TEXT,
    "dedupe_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_follow_up_queue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "client_interest_profiles_user_id_key" ON "client_interest_profiles"("user_id");
CREATE UNIQUE INDEX "client_celebration_profiles_user_id_key" ON "client_celebration_profiles"("user_id");
CREATE UNIQUE INDEX "client_follow_up_queue_dedupe_key_key" ON "client_follow_up_queue"("dedupe_key");

CREATE INDEX "client_interest_profiles_intent_stage_idx" ON "client_interest_profiles"("intent_stage");
CREATE INDEX "client_interest_profiles_interest_score_idx" ON "client_interest_profiles"("interest_score");
CREATE INDEX "client_interest_profiles_top_city_idx" ON "client_interest_profiles"("top_city");
CREATE INDEX "client_celebration_profiles_birth_date_idx" ON "client_celebration_profiles"("birth_date");
CREATE INDEX "client_follow_up_queue_user_id_status_idx" ON "client_follow_up_queue"("user_id", "status");
CREATE INDEX "client_follow_up_queue_scheduled_at_status_idx" ON "client_follow_up_queue"("scheduled_at", "status");
CREATE INDEX "client_follow_up_queue_type_status_idx" ON "client_follow_up_queue"("type", "status");

ALTER TABLE "client_interest_profiles"
ADD CONSTRAINT "client_interest_profiles_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "client_celebration_profiles"
ADD CONSTRAINT "client_celebration_profiles_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "client_follow_up_queue"
ADD CONSTRAINT "client_follow_up_queue_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
