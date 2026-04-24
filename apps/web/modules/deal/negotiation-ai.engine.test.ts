import { describe, expect, it } from "vitest";
import { computeNegotiationStrategies } from "./negotiation-ai.engine";

const baseCtx = {
  dealPriceCad: 480_000,
  listPriceCad: 510_000,
  comparableMedianCad: 500_000,
  comparableSampleSize: 10,
  buyerSellerMotivationNote: "Engaged seller",
  urgencyDaysSinceActivity: 3,
  priorOfferCount: 2,
  inspectionStress: "low" as const,
  financingStrength: "moderate" as const,
  dealStatus: "accepted",
};

describe("negotiation-ai.engine", () => {
  it("returns three ordered strategy types", () => {
    const rows = computeNegotiationStrategies(baseCtx);
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.strategyType)).toEqual(["AGGRESSIVE", "BALANCED", "SAFE"]);
  });

  it("ranks aggressive price closest to list when below list (seller counter up)", () => {
    const rows = computeNegotiationStrategies(baseCtx);
    expect(rows[0]!.suggestedPrice).toBeGreaterThanOrEqual(rows[1]!.suggestedPrice);
    expect(rows[1]!.suggestedPrice).toBeGreaterThanOrEqual(rows[2]!.suggestedPrice);
  });

  it("includes reasoning risk/reward", () => {
    const rows = computeNegotiationStrategies(baseCtx);
    for (const r of rows) {
      expect(r.reasoningJson.riskReward.risk.length).toBeGreaterThan(5);
      expect(r.confidenceScore).toBeGreaterThanOrEqual(30);
      expect(r.confidenceScore).toBeLessThanOrEqual(95);
    }
  });
});
