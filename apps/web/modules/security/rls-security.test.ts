import { describe, expect, it } from "vitest";
import { RLS_LOGICAL_TO_CANDIDATES, getRlsTargetDiscovery } from "./rls-target-discovery.service";

/**
 * Static contract tests — no DB. Cross-user isolation at the database layer requires
 * distinct Supabase JWT sessions; see docs/rls-policies.md ("Manual cross-user expectations").
 */
describe("LECIPM RLS target discovery", () => {
  it("maps five logical domains to Prisma physical names", () => {
    const d = getRlsTargetDiscovery();
    expect(d.bookingsTable).toBe("Booking");
    expect(d.listingsTable).toBe("bnhub_listings");
    expect(d.usersTable).toBe("User");
    expect(d.dealsTable).toBe("deals");
    expect(d.paymentsTable).toBe("payments");
  });

  it("has candidate lists for each logical domain", () => {
    expect(Object.keys(RLS_LOGICAL_TO_CANDIDATES).sort()).toEqual([
      "bookings",
      "deals",
      "listings",
      "payments",
      "users",
    ]);
  });
});
