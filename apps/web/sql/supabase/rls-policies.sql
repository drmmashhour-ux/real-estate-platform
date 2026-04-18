-- LECIPM RLS Security Enforcement v1 — policies for Supabase Auth (auth.uid()).
-- Prerequisite: public."User".id MUST match auth.users.id for the same person when using Supabase Auth.
-- The application API uses Prisma with a service-role / pooled URL — that connection BYPASSES RLS.
-- These policies protect: PostgREST, Realtime, SQL editor as authenticated/anon, and any non-service clients.
--
-- Idempotent: drop then recreate named policies.

-- ---------------------------------------------------------------------------
-- Booking
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS lecipm_booking_select ON "Booking";
DROP POLICY IF EXISTS lecipm_booking_insert ON "Booking";
DROP POLICY IF EXISTS lecipm_booking_update ON "Booking";
DROP POLICY IF EXISTS lecipm_booking_delete ON "Booking";

CREATE POLICY lecipm_booking_select ON "Booking"
  FOR SELECT TO authenticated
  USING (
    "guestId" = (auth.uid())::text
    OR EXISTS (
      SELECT 1
      FROM "bnhub_listings" l
      WHERE l.id = "Booking"."listingId"
        AND l.host_id = (auth.uid())::text
    )
  );

CREATE POLICY lecipm_booking_insert ON "Booking"
  FOR INSERT TO authenticated
  WITH CHECK ("guestId" = (auth.uid())::text);

CREATE POLICY lecipm_booking_update ON "Booking"
  FOR UPDATE TO authenticated
  USING (
    "guestId" = (auth.uid())::text
    OR EXISTS (
      SELECT 1
      FROM "bnhub_listings" l
      WHERE l.id = "Booking"."listingId"
        AND l.host_id = (auth.uid())::text
    )
  )
  WITH CHECK (
    "guestId" = (auth.uid())::text
    OR EXISTS (
      SELECT 1
      FROM "bnhub_listings" l
      WHERE l.id = "Booking"."listingId"
        AND l.host_id = (auth.uid())::text
    )
  );

CREATE POLICY lecipm_booking_delete ON "Booking"
  FOR DELETE TO authenticated
  USING (
    "guestId" = (auth.uid())::text
    OR EXISTS (
      SELECT 1
      FROM "bnhub_listings" l
      WHERE l.id = "Booking"."listingId"
        AND l.host_id = (auth.uid())::text
    )
  );

-- ---------------------------------------------------------------------------
-- bnhub_listings — public read for published; host full CRUD on own rows
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS lecipm_bnhub_listings_select ON "bnhub_listings";
DROP POLICY IF EXISTS lecipm_bnhub_listings_insert ON "bnhub_listings";
DROP POLICY IF EXISTS lecipm_bnhub_listings_update ON "bnhub_listings";
DROP POLICY IF EXISTS lecipm_bnhub_listings_delete ON "bnhub_listings";

CREATE POLICY lecipm_bnhub_listings_select ON "bnhub_listings"
  FOR SELECT TO anon, authenticated
  USING (
    "listingStatus" IN ('PUBLISHED', 'APPROVED')
    OR host_id = (auth.uid())::text
  );

CREATE POLICY lecipm_bnhub_listings_insert ON "bnhub_listings"
  FOR INSERT TO authenticated
  WITH CHECK (host_id = (auth.uid())::text);

CREATE POLICY lecipm_bnhub_listings_update ON "bnhub_listings"
  FOR UPDATE TO authenticated
  USING (host_id = (auth.uid())::text)
  WITH CHECK (host_id = (auth.uid())::text);

CREATE POLICY lecipm_bnhub_listings_delete ON "bnhub_listings"
  FOR DELETE TO authenticated
  USING (host_id = (auth.uid())::text);

-- ---------------------------------------------------------------------------
-- User — own row only (no password hash leakage across users)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS lecipm_user_select_own ON "User";
DROP POLICY IF EXISTS lecipm_user_update_own ON "User";

CREATE POLICY lecipm_user_select_own ON "User"
  FOR SELECT TO authenticated
  USING (id = (auth.uid())::text);

CREATE POLICY lecipm_user_update_own ON "User"
  FOR UPDATE TO authenticated
  USING (id = (auth.uid())::text)
  WITH CHECK (id = (auth.uid())::text);

-- ---------------------------------------------------------------------------
-- deals — buyer, seller, assigned broker
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS lecipm_deals_select ON deals;
DROP POLICY IF EXISTS lecipm_deals_insert ON deals;
DROP POLICY IF EXISTS lecipm_deals_update ON deals;
DROP POLICY IF EXISTS lecipm_deals_delete ON deals;

CREATE POLICY lecipm_deals_select ON deals
  FOR SELECT TO authenticated
  USING (
    buyer_id = (auth.uid())::text
    OR seller_id = (auth.uid())::text
    OR broker_id = (auth.uid())::text
  );

CREATE POLICY lecipm_deals_insert ON deals
  FOR INSERT TO authenticated
  WITH CHECK (
    buyer_id = (auth.uid())::text
    OR seller_id = (auth.uid())::text
    OR broker_id = (auth.uid())::text
  );

CREATE POLICY lecipm_deals_update ON deals
  FOR UPDATE TO authenticated
  USING (
    buyer_id = (auth.uid())::text
    OR seller_id = (auth.uid())::text
    OR broker_id = (auth.uid())::text
  )
  WITH CHECK (
    buyer_id = (auth.uid())::text
    OR seller_id = (auth.uid())::text
    OR broker_id = (auth.uid())::text
  );

-- Prefer app-layer cancellation; DB delete limited to assigned broker to avoid cross-party deletes.
CREATE POLICY lecipm_deals_delete ON deals
  FOR DELETE TO authenticated
  USING (broker_id = (auth.uid())::text);

-- ---------------------------------------------------------------------------
-- payments — via Booking (guest or listing host)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS lecipm_payments_select ON payments;
DROP POLICY IF EXISTS lecipm_payments_update ON payments;

CREATE POLICY lecipm_payments_select ON payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM "Booking" b
      WHERE b.id = payments."bookingId"
        AND (
          b."guestId" = (auth.uid())::text
          OR EXISTS (
            SELECT 1
            FROM "bnhub_listings" l
            WHERE l.id = b."listingId"
              AND l.host_id = (auth.uid())::text
          )
        )
    )
  );

CREATE POLICY lecipm_payments_update ON payments
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM "Booking" b
      WHERE b.id = payments."bookingId"
        AND (
          b."guestId" = (auth.uid())::text
          OR EXISTS (
            SELECT 1
            FROM "bnhub_listings" l
            WHERE l.id = b."listingId"
              AND l.host_id = (auth.uid())::text
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM "Booking" b
      WHERE b.id = payments."bookingId"
        AND (
          b."guestId" = (auth.uid())::text
          OR EXISTS (
            SELECT 1
            FROM "bnhub_listings" l
            WHERE l.id = b."listingId"
              AND l.host_id = (auth.uid())::text
          )
        )
    )
  );
