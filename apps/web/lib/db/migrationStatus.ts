/**
 * Order 92 — which HTTP areas use the split marketplace client vs the monolith (indicative prefixes).
 * Extend the arrays as migration progresses; not every sub-route is listed.
 */
export const migrationStatus = {
  marketplace: ["/api/bookings", "/api/listings", "/api/availability"],
  monolith: ["/api/stripe", "/api/users", "/api/compliance"],
} as const;

export type MigrationStatus = typeof migrationStatus;
