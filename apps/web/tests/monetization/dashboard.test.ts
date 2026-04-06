import { describe, expect, it } from "vitest";
import { getMonetizationAdminSnapshot } from "@/lib/monetization/dashboard";
import { projectGrossRevenueCents } from "@/lib/monetization/projections";
import { PRICING } from "@/lib/monetization/pricing";

describe("getMonetizationAdminSnapshot", () => {
  it("returns streams, risks, and a coherent example projection", () => {
    const snap = getMonetizationAdminSnapshot();
    expect(snap.pricing.bookingFeePercent).toBe(PRICING.bookingFeePercent);
    expect(snap.streams.length).toBeGreaterThan(0);
    expect(snap.streams.every((s) => s.active)).toBe(true);
    expect(snap.risks.length).toBeGreaterThan(0);
    expect(snap.projectedFromExampleCents.totalCents).toBe(
      projectGrossRevenueCents(snap.exampleModel).totalCents,
    );
  });

  it("example model hits ~$10.5k CAD/month at default PRICING", () => {
    const snap = getMonetizationAdminSnapshot();
    const p = snap.projectedFromExampleCents;
    expect(p.bookingFeesCents).toBe(100 * 50_000 * PRICING.bookingFeePercent);
    expect(p.leadsCents).toBe(20 * PRICING.leadPriceCents);
    expect(p.totalCents).toBe(p.bookingFeesCents + p.leadsCents + p.featuredCents);
    expect(p.totalCents).toBe(1_050_000);
  });
});
