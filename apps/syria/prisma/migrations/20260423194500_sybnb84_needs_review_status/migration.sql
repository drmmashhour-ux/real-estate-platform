-- ORDER SYBNB-84 — fraud-queue listing status (report threshold hides listing from browse feeds).
DO $$
BEGIN
  ALTER TYPE "SyriaPropertyStatus" ADD VALUE 'NEEDS_REVIEW';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
