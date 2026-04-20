import type { GrowthSignal } from "../growth.types";
import type { GrowthSnapshot } from "../growth.types";
import { median, stableSignalId } from "./growth-detector-utils";

/** Good ranking cache but bottom-half engagement proxy — uses ranking vs funnel views when present */
export function detectUnderexposedListingCluster(snapshot: GrowthSnapshot): GrowthSignal[] {
  const out: GrowthSignal[] = [];
  const scores = snapshot.rankingHints.map((r) => r.rankingScore ?? 0).filter((n) => n > 0);
  const scoreMed = median(scores);
  if (scoreMed <= 0) return out;

  const viewMap = new Map(snapshot.funnelRatiosByListing.map((f) => [f.listingId, f.views]));
  const viewVals = [...viewMap.values()].sort((a, b) => a - b);
  const p25 = viewVals.length ? viewVals[Math.floor(viewVals.length * 0.25)] : 0;

  for (const r of snapshot.rankingHints) {
    const rs = r.rankingScore ?? 0;
    const v = viewMap.get(r.listingId) ?? 0;
    if (rs < scoreMed * 0.9) continue;
    if (v > p25 * 1.2) continue;
    out.push({
      id: stableSignalId(["underexposed", r.listingId]),
      signalType: "underexposed_listing_cluster",
      severity: "warning",
      entityType: "fsbo_listing",
      entityId: r.listingId,
      region: null,
      locale: snapshot.locale,
      country: snapshot.country,
      title: "Inventory cluster: strong ranking cache, weak recent funnel views",
      explanation:
        "Listing ranking cache suggests quality signals but funnel views are in the lower band — review visibility/trust CTAs (no ranking internals exposed publicly).",
      observedAt: snapshot.collectedAt,
      metadata: { rankingScore: rs, views30d: v, peerMedianRanking: scoreMed },
    });
  }
  return out.slice(0, 12);
}
