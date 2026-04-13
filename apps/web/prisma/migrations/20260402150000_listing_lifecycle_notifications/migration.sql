-- Idempotency flags for seller welcome + sale celebration delivery
ALTER TABLE "fsbo_listings" ADD COLUMN "seller_activation_notified_at" TIMESTAMP(3);
ALTER TABLE "deals" ADD COLUMN "sale_celebration_notified_at" TIMESTAMP(3);
