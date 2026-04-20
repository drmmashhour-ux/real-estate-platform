import { describe, expect, it } from "vitest";
import { detectDemandSupplyImbalance } from "../detectors/demand-supply-imbalance.detector";
import { emptyGrowthSnapshot } from "./snapshot-fixtures";

describe("detectDemandSupplyImbalance", () => {
  it("fires when demand proxy materially exceeds supply", () => {
    const snap = emptyGrowthSnapshot({
      demandSignals: [{ regionKey: "QC-MTL", buyerIntentProxy: 0.35, supplyCount: 8 }],
    });
    expect(() => detectDemandSupplyImbalance(snap)).not.toThrow();
    const signals = detectDemandSupplyImbalance(snap);
    expect(signals.length).toBeGreaterThan(0);
    expect(signals[0]?.signalType).toBe("demand_supply_imbalance");
    expect(signals[0]?.region).toBe("QC-MTL");
  });

  it("does not fire when demand and supply are balanced", () => {
    const snap = emptyGrowthSnapshot({
      demandSignals: [{ regionKey: "QC-QC", buyerIntentProxy: 0.05, supplyCount: 50 }],
    });
    expect(detectDemandSupplyImbalance(snap)).toHaveLength(0);
  });

  it("does not throw with empty demand signals", () => {
    expect(() => detectDemandSupplyImbalance(emptyGrowthSnapshot())).not.toThrow();
  });
});
