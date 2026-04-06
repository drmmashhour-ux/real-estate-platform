import { describe, expect, it } from "vitest";
import { computeFunnelRates } from "@/lib/growth/funnels";
import type { GrowthEventName } from "@/lib/growth/types";

function c(partial: Partial<Record<GrowthEventName, number>>): Record<GrowthEventName, number> {
  const base = Object.fromEntries(
    (
      [
        "landing_page_viewed",
        "listings_browse_viewed",
        "listing_viewed",
        "contact_host_clicked",
        "booking_request_started",
        "booking_request_submitted",
        "checkout_started",
        "payment_completed",
        "manual_payment_marked_received",
        "booking_confirmed",
        "host_signup_started",
        "host_signup_completed",
        "listing_created",
        "listing_published",
        "language_switched",
        "market_mode_used",
        "ai_suggestion_accepted",
      ] as const
    ).map((k) => [k, 0]),
  ) as Record<GrowthEventName, number>;
  return { ...base, ...partial };
}

describe("computeFunnelRates", () => {
  it("computes listing view to contact rate", () => {
    const counts = c({ listing_viewed: 100, contact_host_clicked: 10 });
    const r = computeFunnelRates(counts, "30d");
    expect(r.listingViewToContactPct).toBeCloseTo(10);
  });

  it("returns null when denominators are zero", () => {
    const counts = c({});
    const r = computeFunnelRates(counts, "7d");
    expect(r.listingViewToContactPct).toBeNull();
  });
});
