import { describe, it, expect } from "vitest";
import { propagateSignalAcrossDomains } from "./brain-cross-domain.service";
import type { CrossDomainLearningSignal } from "./brain-v2.types";

function sig(over: Partial<CrossDomainLearningSignal> = {}): CrossDomainLearningSignal {
  return {
    source: "ADS",
    direction: "POSITIVE",
    magnitude: 0.7,
    durability: { stabilityScore: 0.8, decayFactor: 0.95, confidence: 0.75 },
    reason: "ads win",
    createdAt: new Date().toISOString(),
    ...over,
  };
}

describe("brain-cross-domain.service", () => {
  it("propagates ADS signal to retargeting and profit domains", () => {
    const impacts = propagateSignalAcrossDomains(sig());
    const targets = new Set(impacts.map((i) => i.affectedDomain));
    expect(targets.has("RETARGETING")).toBe(true);
    expect(targets.has("PROFIT")).toBe(true);
    expect(impacts.every((i) => Number.isFinite(i.impactWeight))).toBe(true);
  });

  it("returns no impacts for neutral signal", () => {
    const impacts = propagateSignalAcrossDomains(sig({ direction: "NEUTRAL" }));
    expect(impacts.length).toBe(0);
  });

  it("produces stable finite weights for PROFIT source", () => {
    const impacts = propagateSignalAcrossDomains(
      sig({ source: "PROFIT", entityId: "x", entityType: "CAMPAIGN" }),
    );
    expect(impacts.length).toBeGreaterThan(0);
    expect(impacts.every((i) => !Number.isNaN(i.impactWeight))).toBe(true);
  });
});
