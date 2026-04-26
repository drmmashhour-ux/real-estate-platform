-- F1: manual payment requests + per-listing finance counters
CREATE TABLE "syria_payment_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "listing_id" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SYP',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "method" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMP(3),

    CONSTRAINT "syria_payment_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "syria_payment_requests_listing_id_status_idx" ON "syria_payment_requests"("listing_id", "status");
CREATE INDEX "syria_payment_requests_status_created_at_idx" ON "syria_payment_requests"("status", "created_at");

ALTER TABLE "syria_payment_requests" ADD CONSTRAINT "syria_payment_requests_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "syria_properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "syria_listing_finance" (
    "listing_id" TEXT NOT NULL,
    "total_requests" INTEGER NOT NULL DEFAULT 0,
    "total_confirmed" INTEGER NOT NULL DEFAULT 0,
    "last_status" TEXT,

    CONSTRAINT "syria_listing_finance_pkey" PRIMARY KEY ("listing_id")
);

ALTER TABLE "syria_listing_finance" ADD CONSTRAINT "syria_listing_finance_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "syria_properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
