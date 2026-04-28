-- SYBNB-10: append-only lightweight SYBNB product analytics events

CREATE TABLE "sybnb_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "listing_id" TEXT,
    "user_id" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sybnb_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sybnb_events_type_created_at_idx" ON "sybnb_events"("type", "created_at");

CREATE INDEX "sybnb_events_listing_id_idx" ON "sybnb_events"("listing_id");

CREATE INDEX "sybnb_events_user_id_idx" ON "sybnb_events"("user_id");

ALTER TABLE "sybnb_events" ADD CONSTRAINT "sybnb_events_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "syria_properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sybnb_events" ADD CONSTRAINT "sybnb_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "syria_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
