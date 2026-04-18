import { describe, it, expect } from "vitest";
import { adaptSourceWeight, getDefaultBrainSourceWeights } from "./brain-weight-adaptation.service";
import type { BrainOutcomeRecord, BrainSourceWeight } from "./brain-v2.types";

const baseAds: BrainSourceWeight = {
  ...getDefaultBrainSourceWeights().find((w) => w.source === "ADS")!,
};

describe("brain-weight-adaptation.service", () => {
  it("returns unchanged when no outcomes", () => {
    const next = adaptSourceWeight({ current: baseAds, outcomes: [] });
    expect(next.weight).toBe(baseAds.weight);
  });

  it("increases weight conservatively on strong positive outcomes", () => {
    const outcomes: BrainOutcomeRecord[] = [
      {
        decisionId: "a",
        source: "ADS",
        entityType: "CAMPAIGN",
        actionType: "X",
        outcomeType: "POSITIVE",
        outcomeScore: 0.25,
        reason: "ok",
        createdAt: new Date().toISOString(),
      },
    ];
    const next = adaptSourceWeight({ current: baseAds, outcomes });
    expect(next.weight).toBeGreaterThan(baseAds.weight);
    expect(next.weight).toBeLessThanOrEqual(1.5);
  });

  it("decreases weight on strong negative outcomes", () => {
    const outcomes: BrainOutcomeRecord[] = [
      {
        decisionId: "b",
        source: "ADS",
        entityType: "CAMPAIGN",
        actionType: "X",
        outcomeType: "NEGATIVE",
        outcomeScore: -0.25,
        reason: "bad",
        createdAt: new Date().toISOString(),
      },
    ];
    const next = adaptSourceWeight({ current: baseAds, outcomes });
    expect(next.weight).toBeLessThan(baseAds.weight);
    expect(next.weight).toBeGreaterThanOrEqual(0.5);
  });

  it("respects caps across repeated positives", () => {
    let cur = { ...baseAds };
    const strongPos: BrainOutcomeRecord = {
      decisionId: "c",
      source: "ADS",
      entityType: "CAMPAIGN",
      actionType: "X",
      outcomeType: "POSITIVE",
      outcomeScore: 0.4,
      reason: "ok",
      createdAt: new Date().toISOString(),
    };
    for (let i = 0; i < 50; i++) {
      cur = adaptSourceWeight({ current: cur, outcomes: [strongPos] });
    }
    expect(cur.weight).toBe(1.5);
  });
});
