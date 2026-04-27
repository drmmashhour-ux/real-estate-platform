-- P3: view-based price tier stored on F1 payment requests
ALTER TABLE "syria_payment_requests" ADD COLUMN "pricing_tier" INTEGER NOT NULL DEFAULT 0;
