-- BNHub guest loyalty: tier profile + idempotent reward events (no points).

CREATE TYPE "LoyaltyTier" AS ENUM ('NONE', 'BRONZE', 'SILVER', 'GOLD');

CREATE TABLE "user_loyalty_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "total_bookings" INTEGER NOT NULL DEFAULT 0,
    "completed_bookings" INTEGER NOT NULL DEFAULT 0,
    "last_booking_at" TIMESTAMP(3),
    "tier" "LoyaltyTier" NOT NULL DEFAULT 'NONE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_loyalty_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_loyalty_profiles_user_id_key" ON "user_loyalty_profiles"("user_id");

ALTER TABLE "user_loyalty_profiles" ADD CONSTRAINT "user_loyalty_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "loyalty_reward_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "tier_before" "LoyaltyTier" NOT NULL,
    "tier_after" "LoyaltyTier" NOT NULL,
    "discount_percent_applied" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_reward_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "loyalty_reward_events_booking_id_key" ON "loyalty_reward_events"("booking_id");
CREATE INDEX "loyalty_reward_events_user_id_idx" ON "loyalty_reward_events"("user_id");

ALTER TABLE "loyalty_reward_events" ADD CONSTRAINT "loyalty_reward_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
