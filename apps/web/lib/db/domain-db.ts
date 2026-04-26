/**
 * Order 83 — domain → database mapping (avoid cross-schema mistakes).
 *
 * | Domain        | Use from `@/lib/db`   |
 * |--------------|------------------------|
 * | users / auth | `coreDB` (and `authPrisma` from `@repo/db-auth` when split) |
 * | listings / stays / marketplace bookings | `marketplaceDB` |
 * | raw analytics SQL | `pool` |
 *
 * @example
 *   await marketplaceDB.booking.findMany();
 *   // not: await coreDB.booking.findMany() — `booking` lives on the marketplace client.
 */

/**
 * Optional dev guard: pass the client you are about to use (e.g. `marketplaceDB`).
 * In production this is a no-op. In development, throws if the client does not look like the marketplace Prisma API.
 */
export function assertMarketplace(
  client: unknown,
  context = "listings|bookings"
): void {
  if (process.env.NODE_ENV === "production") {
    return;
  }
  const c = client as Record<string, unknown> | null | undefined;
  if (c == null) {
    throw new Error(
      `[domain-db] ${context}: pass marketplaceDB from @/lib/db (Order 83).`
    );
  }
  if (typeof c.booking !== "object" || c.booking == null) {
    throw new Error(
      `[domain-db] ${context}: expected marketplace Prisma (has .booking). Use marketplaceDB, not coreDB.`
    );
  }
  if (typeof (c.booking as { findMany?: unknown }).findMany !== "function") {
    throw new Error(
      `[domain-db] ${context}: invalid marketplace client (missing booking.findMany).`
    );
  }
}
