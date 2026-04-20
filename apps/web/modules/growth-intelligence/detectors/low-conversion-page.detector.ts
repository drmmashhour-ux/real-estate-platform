import {
  GROWTH_LOW_CONVERSION_RATIO_THRESHOLD,
  GROWTH_MIN_LISTING_VIEWS_FOR_CONVERSION,
} from "../growth.config";
import type { GrowthSignal } from "../growth.types";
import type { GrowthSnapshot } from "../growth.types";
import { explain, stableSignalId } from "./growth-detector-utils";

export function detectLowConversionPage(snapshot: GrowthSnapshot): GrowthSignal[] {
  const out: GrowthSignal[] = [];
  for (const row of snapshot.funnelRatiosByListing) {
    if (!row.listingId) continue;
    if (row.views < GROWTH_MIN_LISTING_VIEWS_FOR_CONVERSION) continue;
    if (row.ratio >= GROWTH_LOW_CONVERSION_RATIO_THRESHOLD) continue;
    out.push({
      id: stableSignalId(["low_conversion", row.listingId]),
      signalType: "low_conversion_page",
      severity: row.ratio < GROWTH_LOW_CONVERSION_RATIO_THRESHOLD / 2 ? "critical" : "warning",
      entityType: "fsbo_listing",
      entityId: row.listingId,
      region: null,
      locale: snapshot.locale,
      country: snapshot.country,
      title: "Listing funnel: traffic without proportional contacts",
      explanation: explain(
        "listing_view vs contact_click ratio below threshold — review CTA clarity and legal gates",
        { views: row.views, contacts: row.contactClicks, ratio: Number(row.ratio.toFixed(4)) }
      ),
      observedAt: snapshot.collectedAt,
      metadata: {
        listingId: row.listingId,
        views: row.views,
        contactClicks: row.contactClicks,
        ratio: row.ratio,
      },
    });
  }
  return out.slice(0, 15);
}
