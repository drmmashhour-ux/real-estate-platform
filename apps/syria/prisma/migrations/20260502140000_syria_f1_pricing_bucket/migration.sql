-- F1 A/B pricing bucket (stored on each payment request for revenue & conversion analysis).
ALTER TABLE "syria_payment_requests" ADD COLUMN "pricing_bucket" INTEGER NOT NULL DEFAULT 0;
