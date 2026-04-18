import { describe, it, expect } from "vitest";
import { validateNegativeSignal } from "./brain-negative-signal.service";
import type { BrainOutcomeRecord, CrossDomainLearningSignal } from "./brain-v2.types";

function outcome(over: Partial<BrainOutcomeRecord>): BrainOutcomeRecord {
  return {
    decisionId: "d1",
    source: "ADS",
    entityType: "CAMPAIGN",
    entityId: "c1",
    actionType: "SCALE",
    outcomeType: "NEGATIVE",
    outcomeScore: -0.4,
    reason: "test",
    createdAt: new Date().toISOString(),
    ...over,
  };
}

function prelim(): CrossDomainLearningSignal {
  return {
    source: "ADS",
    entityId: "c1",
    entityType: "CAMPAIGN",
    direction: "NEGATIVE",
    magnitude: 0.6,
    durability: { stabilityScore: 0.5, decayFactor: 0.9, confidence: 0.4 },
    reason: "negative test",
    metadata: { evidenceScore: 0.2 },
    createdAt: new Date().toISOString(),
  };
}

describe("brain-negative-signal.service", () => {
  it("downgrades weak negative without volume corroboration", () => {
    const history: BrainOutcomeRecord[] = [outcome({ outcomeType: "POSITIVE", decisionId: "p1" })];
    const r = validateNegativeSignal(prelim(), history);
    expect(r.signal.direction).toBe("NEUTRAL");
  });

  it("does not emit guard when evidence is acceptable and volume met", () => {
    const history: BrainOutcomeRecord[] = [
      outcome({ decisionId: "n1", outcomeType: "NEGATIVE" }),
      outcome({ decisionId: "n2", outcomeType: "NEGATIVE" }),
      outcome({ decisionId: "n3", outcomeType: "NEGATIVE", outcomeScore: -0.35 }),
    ];
    const p = prelim();
    p.metadata = { evidenceScore: 0.55 };
    const r = validateNegativeSignal(p, history);
    expect(r.guardLowQuality).toBeFalsy();
  });
});
