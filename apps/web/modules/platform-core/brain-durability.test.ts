import { describe, it, expect } from "vitest";
import { computeSignalDurability } from "./brain-signal-durability.service";

describe("brain-signal-durability.service", () => {
  it("returns bounded durability with empty observations", () => {
    const d = computeSignalDurability([]);
    expect(d.stabilityScore).toBeGreaterThanOrEqual(0);
    expect(d.stabilityScore).toBeLessThanOrEqual(1);
    expect(d.confidence).toBeGreaterThanOrEqual(0);
    expect(d.decayFactor).toBeGreaterThan(0);
    expect(d.decayFactor).toBeLessThanOrEqual(1);
  });

  it("increases stability with consistent positive direction", () => {
    const t0 = new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString();
    const t1 = new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString();
    const inconsistent = computeSignalDurability([
      { direction: "POSITIVE", createdAt: t0 },
      { direction: "NEGATIVE", createdAt: t1 },
    ]);
    const consistent = computeSignalDurability([
      { direction: "POSITIVE", createdAt: t0, magnitude: 0.7 },
      { direction: "POSITIVE", createdAt: t1, magnitude: 0.75 },
    ]);
    expect(consistent.stabilityScore).toBeGreaterThanOrEqual(inconsistent.stabilityScore);
  });

  it("does not produce NaN weights", () => {
    const d = computeSignalDurability([
      { direction: "NEUTRAL", createdAt: new Date().toISOString(), magnitude: 0.4 },
    ]);
    expect(Number.isNaN(d.stabilityScore)).toBe(false);
    expect(Number.isNaN(d.confidence)).toBe(false);
  });
});
