import { describe, expect, it } from "vitest";
import { computeLeadValueAndPrice } from "../lead-pricing.service";

describe("computeLeadValueAndPrice", () => {
  it("returns bounded score and price within min/max cents", () => {
    const r = computeLeadValueAndPrice(
      {
        message: "Looking to invest in a multiplex urgent closing",
        leadType: "invest",
        score: 85,
        engagementScore: 20,
        interactionCount: 3,
        hasCompleteContact: true,
      },
      { basePriceCents: 25_000, minCents: 10_000, maxCents: 50_000 },
    );
    expect(r.leadScore).toBeGreaterThanOrEqual(0);
    expect(r.leadScore).toBeLessThanOrEqual(100);
    expect(r.leadPriceCents).toBeGreaterThanOrEqual(10_000);
    expect(r.leadPriceCents).toBeLessThanOrEqual(50_000);
    expect(Number.isFinite(r.leadPrice)).toBe(true);
    expect(["low", "medium", "high"]).toContain(r.leadValue);
  });

  it("uses per-lead basePriceCents override when set", () => {
    const r = computeLeadValueAndPrice(
      {
        message: "Hello",
        score: 50,
        interactionCount: 0,
        hasCompleteContact: true,
      },
      { basePriceCents: 33_00, minCents: 1_000, maxCents: 99_000 },
    );
    expect(r.leadPriceCents).toBe(33_00);
  });

  it("uses neutral band confidence when data is sparse", () => {
    const r = computeLeadValueAndPrice(
      { message: "", score: 40, interactionCount: 0, hasCompleteContact: false },
      { minCents: 5_000, maxCents: 20_000 },
    );
    expect(r.confidence).toBe("low");
  });

  it("maps high score toward high band before clamp", () => {
    const r = computeLeadValueAndPrice(
      {
        message: "Investment duplex urgent closing this week",
        leadType: "invest",
        score: 95,
        engagementScore: 30,
        interactionCount: 5,
        hasCompleteContact: true,
      },
      { minCents: 1_000, maxCents: 250_00 },
    );
    expect(r.leadValue).toBe("high");
    expect(r.leadPriceCents).toBeGreaterThan(1_000);
  });
});
