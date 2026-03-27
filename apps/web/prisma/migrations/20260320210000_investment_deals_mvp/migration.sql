-- CreateTable
CREATE TABLE IF NOT EXISTS "investment_deals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "property_price" DOUBLE PRECISION NOT NULL,
    "monthly_rent" DOUBLE PRECISION NOT NULL,
    "monthly_expenses" DOUBLE PRECISION NOT NULL,
    "roi" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investment_deals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "investment_deals_user_id_idx" ON "investment_deals"("user_id");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'investment_deals_user_id_fkey'
  ) THEN
    ALTER TABLE "investment_deals" ADD CONSTRAINT "investment_deals_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
