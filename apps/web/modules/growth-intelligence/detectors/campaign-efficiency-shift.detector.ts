import { GROWTH_CAMPAIGN_EFFICIENCY_SHIFT_PCT } from "../growth.config";
import type { GrowthSignal } from "../growth.types";
import type { GrowthSnapshot } from "../growth.types";
import { median, stableSignalId } from "./growth-detector-utils";

export function detectCampaignEfficiencyShift(snapshot: GrowthSnapshot): GrowthSignal[] {
  const out: GrowthSignal[] = [];
  const effs = snapshot.campaignRollups.map((c) => c.efficiency).filter((x) => x > 0);
  const med = median(effs);
  if (med <= 0) return out;

  for (const c of snapshot.campaignRollups) {
    if (!c.sourceKey) continue;
    const deltaPct = med > 0 ? Math.abs((c.efficiency - med) / med) * 100 : 0;
    if (deltaPct < GROWTH_CAMPAIGN_EFFICIENCY_SHIFT_PCT) continue;
    out.push({
      id: stableSignalId(["campaign_shift", c.sourceKey]),
      signalType: "campaign_efficiency_shift",
      severity: deltaPct >= GROWTH_CAMPAIGN_EFFICIENCY_SHIFT_PCT * 2 ? "warning" : "info",
      entityType: "campaign_source",
      entityId: null,
      region: null,
      locale: snapshot.locale,
      country: snapshot.country,
      title: `Campaign source efficiency drift: ${c.sourceKey}`,
      explanation:
        "contact_click / listing_view efficiency for this source diverges from peer median — advisory review only; no budget mutation.",
      observedAt: snapshot.collectedAt,
      metadata: { sourceKey: c.sourceKey, efficiency: c.efficiency, peerMedian: med, deltaPct },
    });
  }
  return out.slice(0, 10);
}
