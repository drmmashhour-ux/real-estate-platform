import "server-only";

import { getSeasonTypeForDate } from "@/lib/market/seasonRules";
import { getDemandHeatmap } from "@/lib/market/demandHeatmap";
import { getListingsDB } from "@/lib/db/routeSwitch";
import { getListingOccupancy30dRatio } from "@/lib/pricing/occupancy30d";
import { buildDailyAdjustment } from "@/lib/pricing/dailyPricingRules";

export { buildDailyAdjustment } from "@/lib/pricing/dailyPricingRules";
export { order61AdjustmentClamp as __order61Clamp } from "@/lib/pricing/dailyPricingRules";

export type GetDailyPriceInput = {
  listingId: string;
  /** YYYY-MM-DD (night) */
  date: string;
  /** Listing base in cents (usually `Math.round(listing.price * 100)`). */
  basePriceCents: number;
};

export type DailyPriceResult = {
  date: string;
  basePriceCents: number;
  /** Rounded to integer percent, display-friendly. */
  adjustmentPercent: number;
  finalPriceCents: number;
  reasons: string[];
};

/**
 * **Single night** — loads demand heat + 30d occupancy; applies Order 61 rules.
 */
export async function getDailyPrice(input: GetDailyPriceInput): Promise<DailyPriceResult> {
  const ymd = input.date.trim().slice(0, 10);
  const parts = ymd.split("-").map((x) => Number(x));
  const d =
    parts.length === 3 && parts.every((n) => Number.isFinite(n)) ? new Date(parts[0]!, parts[1]! - 1, parts[2]!) : new Date();
  const season = getSeasonTypeForDate(d);

  const listDb = getListingsDB();
  const listing = await listDb.listing.findUnique({
    where: { id: input.listingId.trim() },
    select: { id: true, city: true },
  });

  const heatmap = await getDemandHeatmap();
  const byCity = new Map(heatmap.map((r) => [r.city.trim().toLowerCase(), r.demandScore] as const));
  const key = listing?.city?.trim().toLowerCase() ?? "";
  const cityDemand = key ? (byCity.get(key) ?? 0) : 0;

  const occ = await getListingOccupancy30dRatio(input.listingId, ymd);
  const { clamped, reasons } = buildDailyAdjustment(d, season, cityDemand, occ);

  const base = Math.max(0, Math.floor(input.basePriceCents));
  const finalPriceCents = Math.max(0, Math.round(base * (1 + clamped)));
  const adjustmentPercent = Math.round(clamped * 100);

  return {
    date: ymd,
    basePriceCents: base,
    adjustmentPercent,
    finalPriceCents,
    reasons,
  };
}
