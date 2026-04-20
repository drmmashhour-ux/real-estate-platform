import type { GrowthSignal } from "../growth.types";
import type { GrowthSnapshot } from "../growth.types";
import { median, stableSignalId } from "./growth-detector-utils";

export function detectHighIntentSearchOpportunity(snapshot: GrowthSnapshot): GrowthSignal[] {
  const out: GrowthSignal[] = [];
  const proxies = snapshot.demandSignals.map((d) => d.buyerIntentProxy);
  const med = median(proxies);
  if (med <= 0) return out;

  for (const d of snapshot.demandSignals) {
    if (d.buyerIntentProxy < med * 1.5) continue;
    if (d.supplyCount > 5) continue;
    out.push({
      id: stableSignalId(["high_intent", d.regionKey]),
      signalType: "high_intent_search_opportunity",
      severity: "info",
      entityType: "region",
      entityId: null,
      region: d.regionKey,
      locale: snapshot.locale,
      country: snapshot.country,
      title: `Demand signal rising vs supply: ${d.regionKey}`,
      explanation: `Buyer-intent proxy (${d.buyerIntentProxy.toFixed(3)}) exceeds median (${med.toFixed(3)}) while supply count is ${d.supplyCount} — consider programmatic landing brief.`,
      observedAt: snapshot.collectedAt,
      metadata: { buyerIntentProxy: d.buyerIntentProxy, supplyCount: d.supplyCount, medianProxy: med },
    });
  }
  return out.slice(0, 10);
}
