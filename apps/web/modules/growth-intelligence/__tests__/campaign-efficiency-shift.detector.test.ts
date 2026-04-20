import { describe, expect, it } from "vitest";
import { detectCampaignEfficiencyShift } from "../detectors/campaign-efficiency-shift.detector";
import { emptyGrowthSnapshot } from "./snapshot-fixtures";

describe("detectCampaignEfficiencyShift", () => {
  it("fires when a source diverges from peer median efficiency", () => {
    const snap = emptyGrowthSnapshot({
      campaignRollups: [
        { sourceKey: "organic", views: 1000, contacts: 40, efficiency: 0.04 },
        { sourceKey: "partner_x", views: 500, contacts: 5, efficiency: 0.01 },
      ],
    });
    expect(() => detectCampaignEfficiencyShift(snap)).not.toThrow();
    const signals = detectCampaignEfficiencyShift(snap);
    expect(signals.length).toBeGreaterThan(0);
    expect(signals.some((s) => s.metadata.sourceKey === "partner_x")).toBe(true);
  });

  it("does not fire when efficiencies cluster near median", () => {
    const snap = emptyGrowthSnapshot({
      campaignRollups: [
        { sourceKey: "a", views: 100, contacts: 10, efficiency: 0.1 },
        { sourceKey: "b", views: 100, contacts: 11, efficiency: 0.11 },
      ],
    });
    expect(detectCampaignEfficiencyShift(snap)).toHaveLength(0);
  });

  it("does not throw with empty campaign rollups", () => {
    expect(() => detectCampaignEfficiencyShift(emptyGrowthSnapshot())).not.toThrow();
  });
});
