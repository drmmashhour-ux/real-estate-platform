/**
 * ORDER SYBNB-108 — Full platform test mode (`SYBNB_TEST_MODE=true`).
 * Synthetic users/listings/bookings must set `isTest: true` so they stay out of public feeds / KPIs.
 */

export function isSybnbFullPlatformTestMode(): boolean {
  return process.env.SYBNB_TEST_MODE === "true";
}

/** Spread into Prisma `create` payloads when tagging synthetic rows. */
export function sybn108OptionalTestFields(): { isTest: boolean } | Record<string, never> {
  return isSybnbFullPlatformTestMode() ? { isTest: true } : {};
}
