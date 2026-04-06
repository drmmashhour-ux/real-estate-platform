-- AlterTable
ALTER TABLE "shared_deal_visits" ADD COLUMN IF NOT EXISTS "referrer_user_id" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "shared_deal_visits_referrer_user_id_idx" ON "shared_deal_visits"("referrer_user_id");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'shared_deal_visits_referrer_user_id_fkey'
  ) THEN
    ALTER TABLE "shared_deal_visits" ADD CONSTRAINT "shared_deal_visits_referrer_user_id_fkey"
      FOREIGN KEY ("referrer_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
