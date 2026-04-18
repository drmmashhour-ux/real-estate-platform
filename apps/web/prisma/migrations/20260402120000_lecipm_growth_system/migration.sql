-- CreateTable
CREATE TABLE "growth_events" (
    "id" TEXT NOT NULL,
    "idempotency_key" VARCHAR(160),
    "user_id" TEXT,
    "session_id" VARCHAR(64),
    "event_name" VARCHAR(64) NOT NULL,
    "metadata" JSONB,
    "utm_source" VARCHAR(256),
    "utm_medium" VARCHAR(128),
    "utm_campaign" VARCHAR(256),
    "utm_term" VARCHAR(256),
    "utm_content" VARCHAR(256),
    "referrer" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_campaigns" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "landing_path" VARCHAR(512),
    "utm_source" VARCHAR(128),
    "utm_medium" VARCHAR(64),
    "utm_campaign" VARCHAR(256),
    "utm_term" VARCHAR(256),
    "utm_content" VARCHAR(256),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "growth_events_idempotency_key_key" ON "growth_events"("idempotency_key");

-- CreateIndex
CREATE INDEX "growth_events_event_name_created_at_idx" ON "growth_events"("event_name", "created_at");

-- CreateIndex
CREATE INDEX "growth_events_user_id_created_at_idx" ON "growth_events"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "growth_events_session_id_created_at_idx" ON "growth_events"("session_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_campaigns_slug_key" ON "marketing_campaigns"("slug");

-- CreateIndex
CREATE INDEX "marketing_campaigns_is_active_idx" ON "marketing_campaigns"("is_active");

-- AddForeignKey
ALTER TABLE "growth_events" ADD CONSTRAINT "growth_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable Lead
ALTER TABLE "Lead" ADD COLUMN "utm_term" VARCHAR(256);
ALTER TABLE "Lead" ADD COLUMN "utm_content" VARCHAR(256);
ALTER TABLE "Lead" ADD COLUMN "referrer_url" TEXT;

-- AlterTable Booking
ALTER TABLE "Booking" ADD COLUMN "growth_attribution_json" JSONB;
