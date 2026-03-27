import { describe, expect, it } from "vitest";
import { estimateWelcomeTaxFromConfig } from "./welcome-tax";

describe("estimateWelcomeTaxFromConfig", () => {
  it("applies marginal brackets", () => {
    const r = estimateWelcomeTaxFromConfig(100_000_00, "default", {
      brackets: [
        { minCents: 0, maxCents: 50_000_00, marginalRatePct: 0.5 },
        { minCents: 50_000_00, maxCents: null, marginalRatePct: 1.0 },
      ],
    });
    // 50,000 @ 0.5% = 250; 50,000 @ 1% = 500 → 750
    expect(r.totalCents).toBe(75_000);
  });
});
