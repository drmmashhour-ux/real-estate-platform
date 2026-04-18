import { describe, it, expect, vi, beforeEach } from "vitest";
import { computeCampaignProfitMetrics, generateProfitRecommendations, maybeIngestProfitEngineIntoUnifiedLearning } from "./profit-engine.service";
import { estimateCampaignLTV } from "@/services/growth/ltv-prediction.service";
import { computeProfitConfidence, mapProfitEvidenceQuality } from "./profit-confidence";
import { ingestUnifiedSignal } from "@/modules/growth/unified-learning.service";

vi.mock("@/modules/growth/unified-learning.service", () => ({
  ingestUnifiedSignal: vi.fn(),
}));

describe("profit-confidence", () => {
  it("returns low score when leads < 3", () => {
    expect(computeProfitConfidence({ leads: 2, bookings: 0, spend: 0, ltvEstimate: 100 })).toBe(0.2);
  });

  it("maps evidence HIGH only with sufficient leads and confidence", () => {
    expect(mapProfitEvidenceQuality(0.9, 12)).toBe("HIGH");
    expect(mapProfitEvidenceQuality(0.9, 4)).toBe("LOW");
  });
});

describe("profit-engine.service", () => {
  beforeEach(() => {
    vi.mocked(ingestUnifiedSignal).mockClear();
  });

  it("returns insufficient data when leads < 3", () => {
    const m = computeCampaignProfitMetrics({
      campaignId: "c1",
      cpl: 50,
      avgLTV: 200,
      leads: 2,
    });
    expect(m.profitabilityStatus).toBe("INSUFFICIENT_DATA");
  });

  it("classifies profitable when ratio high", () => {
    const m = computeCampaignProfitMetrics({
      campaignId: "c2",
      cpl: 50,
      avgLTV: 200,
      leads: 10,
      bookings: 3,
      spend: 100,
    });
    expect(m.profitabilityStatus).toBe("PROFITABLE");
    expect(m.ltvToCplRatio).toBe(4);
    expect(m.profitLearningSignal).toBe("PROFITABLE");
  });

  it("estimateCampaignLTV returns null without booking signal", () => {
    expect(estimateCampaignLTV({ leads: 5, bookings: 0 })).toBeNull();
    expect(estimateCampaignLTV({ leads: 0 })).toBeNull();
  });

  it("estimateCampaignLTV uses booking rate when bookings exist", () => {
    expect(estimateCampaignLTV({ leads: 10, bookings: 2, avgBookingValue: 200 })).toBe(40);
  });

  it("generateProfitRecommendations maps scale for profitable + conversion", () => {
    const metrics = [
      computeCampaignProfitMetrics({
        campaignId: "a",
        cpl: 40,
        avgLTV: 200,
        leads: 10,
        bookings: 2,
        spend: 80,
      }),
    ];
    const rec = generateProfitRecommendations(metrics, { a: 0.06 });
    expect(rec[0]?.action).toBe("SCALE");
  });

  it("maybeIngestProfitEngineIntoUnifiedLearning ingests weak signal with dampening hooks", () => {
    const metrics = [
      computeCampaignProfitMetrics({
        campaignId: "loss",
        cpl: 100,
        avgLTV: 50,
        leads: 8,
        bookings: 1,
        spend: 50,
      }),
    ];
    expect(metrics[0]?.profitLearningSignal).toBe("UNPROFITABLE");
    maybeIngestProfitEngineIntoUnifiedLearning(metrics);
    expect(ingestUnifiedSignal).toHaveBeenCalled();
    const call = vi.mocked(ingestUnifiedSignal).mock.calls.find((c) => c[0]?.signalType === "WEAK");
    expect(call).toBeDefined();
  });
});
