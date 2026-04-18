import { describe, expect, it } from "vitest";
import { linkGrowthSignalsToOutcomes } from "../growth-learning-linker.service";

describe("linkGrowthSignalsToOutcomes", () => {
  it("returns deterministic signals and outcomes without mutating input", () => {
    const metrics = {
      observedAt: "2026-04-01T12:00:00.000Z",
      leadsTodayEarly: 2,
      totalEarlyLeads: 40,
      adsHealth: "OK" as const,
      dueNowCount: 0,
      hotLeadCount: 3,
      attributedCampaigns: 2,
      crmLeadTotal: 120,
    };
    const { signals, outcomes } = linkGrowthSignalsToOutcomes(metrics);
    expect(signals.length).toBe(outcomes.length);
    expect(signals.length).toBeGreaterThanOrEqual(5);
    for (const o of outcomes) {
      expect(signals.some((s) => s.id === o.signalId)).toBe(true);
    }
  });

  it("marks insufficient_data when CRM is tiny", () => {
    const { outcomes } = linkGrowthSignalsToOutcomes({
      observedAt: "2026-04-01T12:00:00.000Z",
      leadsTodayEarly: 0,
      totalEarlyLeads: 0,
      adsHealth: "WEAK",
      dueNowCount: 0,
      hotLeadCount: 0,
      attributedCampaigns: 0,
      crmLeadTotal: 1,
    });
    expect(outcomes.some((o) => o.outcomeType === "insufficient_data")).toBe(true);
  });
});
