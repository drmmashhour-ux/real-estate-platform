import { GROWTH_DEMAND_SUPPLY_IMBALANCE_FACTOR } from "../growth.config";
import type { GrowthSignal } from "../growth.types";
import type { GrowthSnapshot } from "../growth.types";
import { stableSignalId } from "./growth-detector-utils";

export function detectDemandSupplyImbalance(snapshot: GrowthSnapshot): GrowthSignal[] {
  const out: GrowthSignal[] = [];
  for (const d of snapshot.demandSignals) {
    const demand = d.buyerIntentProxy * 100;
    const supply = Math.max(1, d.supplyCount);
    if (demand < supply * GROWTH_DEMAND_SUPPLY_IMBALANCE_FACTOR) continue;
    out.push({
      id: stableSignalId(["demand_supply", d.regionKey]),
      signalType: "demand_supply_imbalance",
      severity: demand > supply * GROWTH_DEMAND_SUPPLY_IMBALANCE_FACTOR * 1.5 ? "warning" : "info",
      entityType: "region",
      entityId: null,
      region: d.regionKey,
      locale: snapshot.locale,
      country: snapshot.country,
      title: `Demand proxy exceeds supply: ${d.regionKey}`,
      explanation:
        "Buyer-intent proxy scaled against active inventory suggests imbalance — advisory acquisition/listing recruitment (no auto-spend).",
      observedAt: snapshot.collectedAt,
      metadata: { buyerIntentProxy: d.buyerIntentProxy, supplyCount: d.supplyCount },
    });
  }
  return out.slice(0, 10);
}
