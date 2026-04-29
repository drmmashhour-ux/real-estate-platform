import { test, expect } from "@playwright/test";

/**
 * Unauthenticated duplicate POSTs must not 500; both short-circuit as 401 before idempotency replay.
 * With session cookies in CI you could assert `duplicate: true` on the second response instead.
 */
test.describe("SYBNB bookings API", () => {
  test("duplicate clientRequestId without auth returns 401 twice (no server crash)", async ({ request }) => {
    const body = {
      listingId: "e2e-listing-placeholder",
      checkIn: "2030-06-01",
      checkOut: "2030-06-07",
      guests: 2,
      clientRequestId: "e2e-idempotency-probe-001",
      clientId: "e2e-client-id-123456789012",
    };
    const r1 = await request.post("/api/sybnb/bookings", { data: body });
    const r2 = await request.post("/api/sybnb/bookings", { data: body });
    expect(r1.status()).toBe(401);
    expect(r2.status()).toBe(401);
  });
});
