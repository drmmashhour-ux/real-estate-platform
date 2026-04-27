-- Fraud / trust engine audit (additive).

CREATE TABLE "risk_events" (
    "id" TEXT NOT NULL,
    "listing_id" VARCHAR(32),
    "user_id" VARCHAR(32),
    "score" INTEGER NOT NULL,
    "decision" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "risk_events_listing_id_created_at_idx" ON "risk_events"("listing_id", "created_at");
CREATE INDEX "risk_events_user_id_created_at_idx" ON "risk_events"("user_id", "created_at");
