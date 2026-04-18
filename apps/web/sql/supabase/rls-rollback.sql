-- LECIPM RLS Security Enforcement v1 — ROLLBACK (dev/staging only).
-- Drops named `lecipm_*` policies and disables RLS on the same critical tables.
-- Idempotent: uses DROP POLICY IF EXISTS; disabling RLS twice is safe.
--
-- WARNING: This removes database-level protection for Supabase anon/authenticated paths.
-- Do not run in production unless you are replacing policies or reverting a bad deploy.
-- Application routes must still enforce auth via Prisma — Prisma bypasses RLS regardless.

-- ---------------------------------------------------------------------------
-- Booking
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS lecipm_booking_select ON "Booking";
DROP POLICY IF EXISTS lecipm_booking_insert ON "Booking";
DROP POLICY IF EXISTS lecipm_booking_update ON "Booking";
DROP POLICY IF EXISTS lecipm_booking_delete ON "Booking";

-- ---------------------------------------------------------------------------
-- bnhub_listings
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS lecipm_bnhub_listings_select ON "bnhub_listings";
DROP POLICY IF EXISTS lecipm_bnhub_listings_insert ON "bnhub_listings";
DROP POLICY IF EXISTS lecipm_bnhub_listings_update ON "bnhub_listings";
DROP POLICY IF EXISTS lecipm_bnhub_listings_delete ON "bnhub_listings";

-- ---------------------------------------------------------------------------
-- User
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS lecipm_user_select_own ON "User";
DROP POLICY IF EXISTS lecipm_user_update_own ON "User";

-- ---------------------------------------------------------------------------
-- deals
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS lecipm_deals_select ON deals;
DROP POLICY IF EXISTS lecipm_deals_insert ON deals;
DROP POLICY IF EXISTS lecipm_deals_update ON deals;
DROP POLICY IF EXISTS lecipm_deals_delete ON deals;

-- ---------------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS lecipm_payments_select ON payments;
DROP POLICY IF EXISTS lecipm_payments_update ON payments;

-- ---------------------------------------------------------------------------
-- Disable RLS (matches enable-rls.sql)
-- ---------------------------------------------------------------------------
ALTER TABLE "Booking" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "bnhub_listings" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "deals" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" DISABLE ROW LEVEL SECURITY;
