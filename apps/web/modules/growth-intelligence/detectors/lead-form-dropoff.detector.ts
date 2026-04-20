import {
  GROWTH_LEAD_FORM_DROPOFF_RATIO,
  GROWTH_MIN_LISTING_VIEWS_FOR_CONVERSION,
} from "../growth.config";
import type { GrowthSignal } from "../growth.types";
import type { GrowthSnapshot } from "../growth.types";
import { stableSignalId } from "./growth-detector-utils";

export function detectLeadFormDropoff(snapshot: GrowthSnapshot): GrowthSignal[] {
  const out: GrowthSignal[] = [];
  for (const row of snapshot.funnelRatiosByListing) {
    if (!row.listingId) continue;
    if (row.views < GROWTH_MIN_LISTING_VIEWS_FOR_CONVERSION) continue;
    if (row.contactClicks < 3) continue;
    if (row.ratio >= GROWTH_LEAD_FORM_DROPOFF_RATIO) continue;
    out.push({
      id: stableSignalId(["lead_dropoff", row.listingId]),
      signalType: "lead_form_dropoff",
      severity: "warning",
      entityType: "fsbo_listing",
      entityId: row.listingId,
      region: null,
      locale: snapshot.locale,
      country: snapshot.country,
      title: "Lead funnel drop-off pattern",
      explanation:
        "Material listing views with contact clicks present but completion ratio remains low — review legal gates, paywall, and form friction.",
      observedAt: snapshot.collectedAt,
      metadata: {
        listingId: row.listingId,
        views: row.views,
        contactClicks: row.contactClicks,
        ratio: row.ratio,
      },
    });
  }
  return out.slice(0, 12);
}
