import type { GrowthSignal } from "../growth.types";
import type { GrowthSnapshot } from "../growth.types";
import { median, stableSignalId } from "./growth-detector-utils";

export function detectHighPerformingRegion(snapshot: GrowthSnapshot): GrowthSignal[] {
  const out: GrowthSignal[] = [];
  const ratios = snapshot.funnelRatiosByListing.map((f) => f.ratio).filter((x) => x > 0);
  const med = median(ratios);
  if (med <= 0) return out;

  for (const d of snapshot.demandSignals) {
    const proxy = d.supplyCount > 0 ? d.buyerIntentProxy / Math.max(1, d.supplyCount) : 0;
    if (proxy < med * 2) continue;
    out.push({
      id: stableSignalId(["high_region", d.regionKey]),
      signalType: "high_performing_region",
      severity: "info",
      entityType: "region",
      entityId: null,
      region: d.regionKey,
      locale: snapshot.locale,
      country: snapshot.country,
      title: `Region deserves promotion review: ${d.regionKey}`,
      explanation:
        "Demand/supply proxy indicates outsized intent relative to inventory — advisory campaign/SEO prioritization only.",
      observedAt: snapshot.collectedAt,
      metadata: { proxy, medianRatio: med },
    });
  }
  return out.slice(0, 8);
}

