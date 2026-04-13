/**
 * Realistic seeded personas and listing handles — requires `prisma db seed` for BNHUB demo data.
 * Dynamic users (Stripe path) are created in `scenarios/lib/bnhub-stripe-paid-flow.ts`.
 */

export const E2E_SEED = {
  listingId: "seed-listing-001",
  guestEmail: "guest@demo.com",
  hostEmail: "host@demo.com",
} as const;

export type E2ETestRole = "guest" | "host" | "admin";

/** Returns seeded demo emails for guest/host; admin uses env (platform ops). */
export function createTestUser(role: Exclude<E2ETestRole, "admin">): { email: string; password: string } {
  const password = process.env.E2E_DEMO_PASSWORD?.trim() || "demo1234";
  if (role === "guest") return { email: E2E_SEED.guestEmail, password };
  return { email: E2E_SEED.hostEmail, password };
}

export function getAdminCredentials(): { email: string; password: string } | null {
  const email = process.env.E2E_ADMIN_EMAIL?.trim();
  const password = process.env.E2E_ADMIN_PASSWORD?.trim();
  if (!email || !password) return null;
  return { email, password };
}

/** Minimal create payload shape for host listing APIs (scenario 5 extends via scenario file). */
export function createTestListingBase(runId: string) {
  return {
    title: `E2E listing ${runId}`,
    nightPriceCents: 12_000,
    city: "Montreal",
    country: "CA",
    maxGuests: 2,
  };
}
