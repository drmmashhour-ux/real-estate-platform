import { describe, expect, it } from "vitest";
import { buildListingSignals } from "@/src/core/intelligence/signals/signalsEngine";
import { computeScores } from "@/src/core/intelligence/scoring/scoringEngine";

describe("scoringEngine", () => {
  it("returns stable deterministic scores", () => {
    const signals = buildListingSignals({ priceCents: 40000000, trustScore: 70, riskScore: 28, freshnessDays: 1 });
    const a = computeScores(signals);
    const b = computeScores(signals);
    expect(a).toEqual(b);
    expect(a.dealScore).toBeGreaterThan(0);
    expect(a.confidenceScore).toBeGreaterThan(0);
  });
});
