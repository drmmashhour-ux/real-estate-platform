import { describe, expect, it } from "vitest";
import { buildInstantValueSummary } from "@/modules/conversion/instant-value.service";

describe("buildInstantValueSummary", () => {
  it("returns stable shape with minimal input and does not mutate input", () => {
    const input = { page: "home" as const };
    const copy = { ...input };
    const s = buildInstantValueSummary(input);
    expect(input).toEqual(copy);
    expect(s.intent).toBe("buy");
    expect(s.headline.length).toBeGreaterThan(0);
    expect(s.subheadline.length).toBeGreaterThan(0);
    expect(s.ctaLabel.length).toBeGreaterThan(0);
    expect(s.trustLines.length).toBeGreaterThan(0);
    expect(s.insights.length).toBeGreaterThanOrEqual(2);
    expect(s.insights.length).toBeLessThanOrEqual(4);
  });

  it("maps intents to distinct headlines for listings page", () => {
    const buy = buildInstantValueSummary({ page: "listings", intent: "buy" });
    const rent = buildInstantValueSummary({ page: "listings", intent: "rent" });
    expect(buy.headline).not.toEqual(rent.headline);
  });

  it("uses listing city when provided (no fabricated prices)", () => {
    const s = buildInstantValueSummary({
      page: "property",
      intent: "buy",
      listing: { city: "Montréal", priceCents: 500_000_00, verified: false, dealType: "sale" },
    });
    const cityInsight = s.insights.find((i) => i.title.includes("Montréal"));
    expect(cityInsight).toBeDefined();
  });
});
