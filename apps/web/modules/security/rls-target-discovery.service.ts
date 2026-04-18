/**
 * LECIPM RLS Security Enforcement v1 — canonical mapping from domain concepts to **actual**
 * PostgreSQL relation names and ownership columns as defined in `prisma/schema.prisma` and
 * `prisma/migrations/000000000000_baseline/migration.sql` (verified; do not guess).
 *
 * Prisma `@@map` / default model names determine quoted identifiers in Postgres.
 */

/** Logical domains audited for RLS (maps to one physical relation each). */
export type RlsLogicalDomain = "bookings" | "listings" | "users" | "deals" | "payments";

/** Candidate physical names probed in order until `pg_class` finds a match. */
export const RLS_LOGICAL_TO_CANDIDATES: Record<RlsLogicalDomain, string[]> = {
  bookings: ["Booking", "booking"],
  listings: ["bnhub_listings"],
  users: ["User", "users"],
  deals: ["deals"],
  payments: ["payments"],
};

export type RlsTargetDiscovery = {
  version: "LECIPM RLS Security Enforcement v1";
  /** Where this mapping was verified. */
  source: "prisma_schema_and_baseline_migration";
  bookingsTable: "Booking";
  listingsTable: "bnhub_listings";
  usersTable: "User";
  dealsTable: "deals";
  paymentsTable: "payments";
  /** Ownership / join columns used by `sql/supabase/rls-policies.sql` (auth.uid()::text). */
  columns: {
    booking: { guestId: '"guestId"'; listingFk: '"listingId"' };
    listing: { hostId: "host_id"; listingStatus: '"listingStatus"' };
    user: { id: "id" };
    deal: { buyerId: "buyer_id"; sellerId: "seller_id"; brokerId: "broker_id" };
    payment: { bookingFk: '"bookingId"' };
  };
};

/**
 * Static discovery — reflects current Prisma models ShortTermListing @@map("bnhub_listings"), etc.
 */
export function getRlsTargetDiscovery(): RlsTargetDiscovery {
  return {
    version: "LECIPM RLS Security Enforcement v1",
    source: "prisma_schema_and_baseline_migration",
    bookingsTable: "Booking",
    listingsTable: "bnhub_listings",
    usersTable: "User",
    dealsTable: "deals",
    paymentsTable: "payments",
    columns: {
      booking: { guestId: '"guestId"', listingFk: '"listingId"' },
      listing: { hostId: "host_id", listingStatus: '"listingStatus"' },
      user: { id: "id" },
      deal: { buyerId: "buyer_id", sellerId: "seller_id", brokerId: "broker_id" },
      payment: { bookingFk: '"bookingId"' },
    },
  };
}
