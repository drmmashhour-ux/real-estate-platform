import { describe, expect, it } from "vitest";
import { buildActionsForRow, getSoftPricingBiasPercent } from "@/lib/market/demandActions";
import type { DemandHeatmapRow } from "@/lib/market/demandHeatmap";

function row(p: Partial<DemandHeatmapRow> & Pick<DemandHeatmapRow, "city">): DemandHeatmapRow {
  return {
    city: p.city,
    views: p.views ?? 0,
    bookings: p.bookings ?? 0,
    listingCount: p.listingCount ?? 10,
    viewsPerListing: p.viewsPerListing ?? 0,
    bookingsPerListing: p.bookingsPerListing ?? 0,
    conversionRate: p.conversionRate ?? 0,
    demandScore: p.demandScore ?? 0,
    bookings7d: p.bookings7d ?? 0,
    bookingsPrev7d: p.bookingsPrev7d ?? 0,
    trend: p.trend ?? 0,
  };
}

describe("Order 83 — demand action rules", () => {
  it("high demand + conversion → increase_prices", () => {
    const a = buildActionsForRow(
      row({
        city: "Montreal",
        demandScore: 120,
        conversionRate: 0.08,
        bookingsPerListing: 0.4,
        trend: 0.1,
      })
    );
    expect(a).toContain("increase_prices");
    expect(getSoftPricingBiasPercent(a)).toBe(5);
  });

  it("high demand + low conversion → improve_listings (not increase_prices)", () => {
    const a = buildActionsForRow(
      row({
        city: "Montreal",
        demandScore: 120,
        conversionRate: 0.02,
        bookingsPerListing: 0.4,
        trend: 0,
      })
    );
    expect(a).toContain("improve_listings");
    expect(a).not.toContain("increase_prices");
  });

  it("low demand + negative trend → boost_marketing", () => {
    const a = buildActionsForRow(
      row({
        city: "Quietville",
        demandScore: 20,
        conversionRate: 0.01,
        bookingsPerListing: 0.1,
        trend: -0.15,
      })
    );
    expect(a).toContain("boost_marketing");
    expect(getSoftPricingBiasPercent(a)).toBe(-5);
  });

  it("low bookings per listing → add_supply", () => {
    const a = buildActionsForRow(
      row({
        city: "Sparse",
        demandScore: 30,
        conversionRate: 0.1,
        bookingsPerListing: 0.05,
        trend: 0.05,
      })
    );
    expect(a).toContain("add_supply");
  });

  it("increase_prices + boost_marketing → net 0% soft pricing bias (capped)", () => {
    const a = ["increase_prices", "boost_marketing"] as const;
    expect(getSoftPricingBiasPercent([...a])).toBe(0);
  });
});
