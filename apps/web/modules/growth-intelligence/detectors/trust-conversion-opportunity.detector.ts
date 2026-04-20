import {
  GROWTH_TRUST_EXPOSURE_VIEW_PERCENTILE_THRESHOLD,
  GROWTH_TRUST_HIGH_BAND_MIN,
} from "../growth.config";
import type { GrowthSignal } from "../growth.types";
import type { GrowthSnapshot } from "../growth.types";
import { stableSignalId } from "./growth-detector-utils";

export function detectTrustConversionOpportunity(snapshot: GrowthSnapshot): GrowthSignal[] {
  const out: GrowthSignal[] = [];
  const viewVals = snapshot.funnelRatiosByListing.map((f) => f.views).sort((a, b) => a - b);
  const idx = Math.floor(viewVals.length * GROWTH_TRUST_EXPOSURE_VIEW_PERCENTILE_THRESHOLD);
  const threshold = viewVals.length ? viewVals[Math.max(0, idx)] : 0;

  const trustRows = snapshot.legalReadinessSamples;
  const trustMap = new Map<string, number | null>();
  for (const t of trustRows) {
    trustMap.set(t.listingId, t.readinessHint);
  }

  for (const r of snapshot.rankingHints) {
    const ts = trustMap.get(r.listingId);
    const trustProxy = ts ?? 0;
    if (trustProxy < GROWTH_TRUST_HIGH_BAND_MIN) continue;
    const fr = snapshot.funnelRatiosByListing.find((f) => f.listingId === r.listingId);
    const v = fr?.views ?? 0;
    if (v > threshold) continue;
    out.push({
      id: stableSignalId(["trust_conversion", r.listingId]),
      signalType: "trust_conversion_opportunity",
      severity: "info",
      entityType: "fsbo_listing",
      entityId: r.listingId,
      region: null,
      locale: snapshot.locale,
      country: snapshot.country,
      title: "Trust-ready listing with weak recent exposure",
      explanation:
        "Trust or ranking signals suggest quality while funnel views sit in the lower band — recommend verification/trust surfaces and CTA clarity (no internal score exposure to buyers).",
      observedAt: snapshot.collectedAt,
      metadata: { rankingScore: r.rankingScore, views30d: v, trustHint: ts },
    });
  }
  return out.slice(0, 12);
}
