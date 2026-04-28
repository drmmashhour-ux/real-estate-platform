-- SYBNB-41: SyriaListingPlan.hotel_featured for subscribed hotels (manual admin activation).

DO $$ BEGIN
  ALTER TYPE "SyriaListingPlan" ADD VALUE 'hotel_featured';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
