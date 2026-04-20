import { GROWTH_SEO_GAP_MIN_LISTINGS_IN_REGION } from "../growth.config";
import type { GrowthSignal } from "../growth.types";
import type { GrowthSnapshot } from "../growth.types";
import { explain, median, stableSignalId } from "./growth-detector-utils";

export function detectSeoGap(snapshot: GrowthSnapshot): GrowthSignal[] {
  const out: GrowthSignal[] = [];
  const counts = snapshot.inventoryByRegion.map((r) => r.activePublicCount);
  const med = median(counts);
  if (med <= 0) return out;

  for (const row of snapshot.inventoryByRegion) {
    if (row.activePublicCount >= GROWTH_SEO_GAP_MIN_LISTINGS_IN_REGION) continue;
    if (row.activePublicCount < med * 0.35 && row.regionKey !== "unknown") {
      out.push({
        id: stableSignalId(["seo_gap", row.regionKey, snapshot.country]),
        signalType: "seo_gap",
        severity: "warning",
        entityType: "region",
        entityId: null,
        region: row.regionKey,
        locale: snapshot.locale,
        country: snapshot.country,
        title: `SEO surface gap: ${row.regionKey}`,
        explanation: explain(
          "Active public inventory in this city is below peer median — consider localized SEO/plan page coverage",
          { medianActive: med.toFixed(1), activeHere: row.activePublicCount }
        ),
        observedAt: snapshot.collectedAt,
        metadata: { medianActive: med, activePublic: row.activePublicCount },
      });
    }
  }
  return out.slice(0, 12);
}
