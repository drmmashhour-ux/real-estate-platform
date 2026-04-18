-- LECIPM RLS Security Enforcement v1 — enable row level security on critical tables.
-- Physical names match Prisma migrations (see prisma/migrations/*).
-- Run AFTER migrations; execute in Supabase SQL editor or: psql "$DATABASE_URL" -f enable-rls.sql
--
-- Tables:
--   "Booking"     — BNHub bookings (camelCase columns: "guestId", "listingId")
--   bnhub_listings — short-term stays (host_id)
--   "User"        — platform accounts
--   deals         — residential deal workspace
--   payments      — BNHub payment rows linked via bookingId → "Booking"

ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bnhub_listings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "deals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
