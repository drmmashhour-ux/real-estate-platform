import { describe, expect, it } from "vitest";
import { PRICING_AI_MAX_DECREASE_RATIO, PRICING_AI_MAX_INCREASE_RATIO, clampSuggestedPriceCents } from "../safety";

describe("pricing-ai safety", () => {
  it("clamps upward to +30%", () => {
    const base = 10_000;
    const { cents, clamped, capCents } = clampSuggestedPriceCents(base, Math.round(base * 2));
    expect(clamped).toBe(true);
    expect(capCents).toBe(Math.round(base * (1 + PRICING_AI_MAX_INCREASE_RATIO)));
    expect(cents).toBe(capCents);
  });

  it("clamps downward to -30%", () => {
    const base = 10_000;
    const { cents, clamped, floorCents } = clampSuggestedPriceCents(base, 100);
    expect(clamped).toBe(true);
    expect(floorCents).toBe(Math.round(base * (1 - PRICING_AI_MAX_DECREASE_RATIO)));
    expect(cents).toBe(floorCents);
  });

  it("does not clamp when inside band", () => {
    const base = 10_000;
    const target = 11_000;
    const { cents, clamped } = clampSuggestedPriceCents(base, target);
    expect(clamped).toBe(false);
    expect(cents).toBe(target);
  });
});
