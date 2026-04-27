import "server-only";

import { getSeasonTypeForDate } from "@/lib/market/seasonRules";
import { getDemandHeatmap } from "@/lib/market/demandHeatmap";
import { getListingsDB } from "@/lib/db/routeSwitch";
import { getListingOccupancy30dRatio } from "@/lib/pricing/occupancy30d";
import { buildDailyAdjustment } from "@/lib/pricing/dailyPricingRules";
import { nightYmdKeysForStay } from "@/lib/booking/nightYmdsBetween";
import { platformFeeCentsFromSubtotal } from "@/lib/pricing/calculateTotal";

export type CalculateDynamicTotalInput = {
  listingId: string;
  startDate: string;
  endDate: string;
  /** Override; default from listing `price * 100`. */
  basePriceCents?: number;
};

export type NightlyPriceLine = {
  date: string;
  priceCents: number;
  adjustmentPercent: number;
  reasons: string[];
};

export type DynamicTotalResult = {
  nights: number;
  nightlyPrices: NightlyPriceLine[];
  subtotalCents: number;
  platformFeeCents: number;
  finalCents: number;
};

/**
 * **Multi-day** stay: each night uses Order 61 rules. **One** 30d occupancy sample is taken
 * from the **first** night to keep the total stable and fast (avoids N occupancy queries per quote).
 */
export async function calculateDynamicTotal(
  input: CalculateDynamicTotalInput
): Promise<DynamicTotalResult | null> {
  const listingId = input.listingId?.trim();
  const start = input.startDate?.trim().slice(0, 10);
  const end = input.endDate?.trim().slice(0, 10);
  if (!listingId || !start || !end) return null;
  if (end <= start) return null;

  const listDb = getListingsDB();
  const row = await listDb.listing.findUnique({
    where: { id: listingId },
    select: { id: true, price: true, city: true },
  });
  if (!row) return null;

  const basePriceCents =
    input.basePriceCents != null && Number.isFinite(input.basePriceCents)
      ? Math.max(0, Math.floor(input.basePriceCents))
      : Math.max(0, Math.round((Number.isFinite(row.price) ? row.price : 0) * 100));

  const nightKeys = nightYmdKeysForStay(start, end);
  if (nightKeys.length === 0) return null;

  const firstYmd = nightKeys[0]!;
  const occ = await getListingOccupancy30dRatio(listingId, firstYmd);
  const heatmap = await getDemandHeatmap();
  const byCity = new Map(heatmap.map((r) => [r.city.trim().toLowerCase(), r.demandScore] as const));
  const ckey = row.city?.trim().toLowerCase() ?? "";
  const cityDemand = ckey ? (byCity.get(ckey) ?? 0) : 0;

  const nightlyPrices: NightlyPriceLine[] = [];
  let subtotalCents = 0;

  for (const ymd of nightKeys) {
    const parts = ymd.split("-").map((x) => Number(x));
    const d =
      parts.length === 3 && parts.every((n) => Number.isFinite(n))
        ? new Date(parts[0]!, parts[1]! - 1, parts[2]!)
        : new Date();
    const season = getSeasonTypeForDate(d);
    const { clamped, reasons } = buildDailyAdjustment(d, season, cityDemand, occ);
    const finalPriceCents = Math.max(0, Math.round(basePriceCents * (1 + clamped)));
    const adjustmentPercent = Math.round(clamped * 100);
    nightlyPrices.push({
      date: ymd,
      priceCents: finalPriceCents,
      adjustmentPercent,
      reasons,
    });
    subtotalCents += finalPriceCents;
  }

  const platformFeeCents = platformFeeCentsFromSubtotal(subtotalCents);
  const finalCents = subtotalCents + platformFeeCents;

  return {
    nights: nightKeys.length,
    nightlyPrices,
    subtotalCents,
    platformFeeCents,
    finalCents,
  };
}
