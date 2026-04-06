-- BNHub production booking fields: guest snapshot, pending expiry, payment refund trace, enums.

ALTER TYPE "BookingStatus" ADD VALUE 'EXPIRED';
ALTER TYPE "PaymentStatus" ADD VALUE 'PARTIALLY_REFUNDED';

ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "guests_count" INTEGER;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "guest_contact_email" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "guest_contact_name" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "guest_contact_phone" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "cancellation_reason" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "canceled_at" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "pending_checkout_expires_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Booking_pending_checkout_expires_at_idx" ON "Booking"("pending_checkout_expires_at");

ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "stripe_last_refund_id" TEXT;
