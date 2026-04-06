-- Track public shared deal page views (growth / leaderboard)
CREATE TABLE "shared_deal_visits" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "referrer_deal_id" TEXT,
    "session_id" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_deal_visits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "shared_deal_visits_deal_id_created_at_idx" ON "shared_deal_visits"("deal_id", "created_at");
CREATE INDEX "shared_deal_visits_created_at_idx" ON "shared_deal_visits"("created_at");

ALTER TABLE "shared_deal_visits" ADD CONSTRAINT "shared_deal_visits_deal_id_fkey"
  FOREIGN KEY ("deal_id") REFERENCES "investment_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
