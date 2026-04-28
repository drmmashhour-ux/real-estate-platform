-- ORDER SYBNB-108 — synthetic test rows (`SYBNB_TEST_MODE=true`) excluded from public feeds via `is_test = false`.

ALTER TABLE "syria_users" ADD COLUMN IF NOT EXISTS "is_test" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "syria_users_is_test_idx" ON "syria_users" ("is_test");

ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "is_test" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "syria_properties_is_test_idx" ON "syria_properties" ("is_test");

ALTER TABLE "sybnb_bookings" ADD COLUMN IF NOT EXISTS "is_test" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "sybnb_bookings_is_test_idx" ON "sybnb_bookings" ("is_test");

ALTER TABLE "syria_bookings" ADD COLUMN IF NOT EXISTS "is_test" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "syria_bookings_is_test_idx" ON "syria_bookings" ("is_test");
