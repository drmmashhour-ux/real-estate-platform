-- ORDER SYBNB-97 — phone reveal counters + inquiry index for spam analytics.
ALTER TABLE "syria_properties" ADD COLUMN "phone_reveal_day_utc" TEXT;
ALTER TABLE "syria_properties" ADD COLUMN "phone_reveal_count_day" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "syria_properties" ADD COLUMN "phone_reveal_cooldown_until" TIMESTAMP(3);

CREATE INDEX "syria_inquiries_from_user_id_created_at_idx" ON "syria_inquiries"("from_user_id", "created_at");
