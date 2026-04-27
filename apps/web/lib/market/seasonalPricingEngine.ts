import { ListingStatus } from "@prisma/client";

import { getLegacyDB } from "@/lib/db/legacy";
import { flags } from "@/lib/flags";
import { getDemandHeatmap } from "@/lib/market/demandHeatmap";
import {
  computeDailyListingPricing,
  isLocalWeekend,
  pressureFromScore,
  toYmdLocal,
  totalAdjustmentPercent,
  type DayType,
  type DemandPressure,
} from "@/lib/market/seasonalPricingMath";
import { getSeasonTypeForDate, type SeasonType } from "@/lib/market/seasonRules";

const prisma = getLegacyDB();

const DEFAULT_DAYS_AHEAD = 30;

export type { DayType, DemandPressure };
export { computeDailyListingPricing };

export type SeasonalPricingRecommendation = {
  listingId: string;
  city: string | null;
  basePrice: number | null;
  date: string;
  dayType: DayType;
  seasonType: SeasonType;
  demandPressure: DemandPressure;
  suggestedPrice: number | null;
  suggestedAdjustmentPercent: number;
  reason: string;
};

export type GetSeasonalPricingOptions = {
  /**
   * Number of calendar days from today (inclusive) to generate rows per listing.
   * Default 30. Admin UI can pass 7 for readability.
   */
  daysAhead?: number;
};

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Per-listing, per-day **recommendations** (read-only). Does not update `nightPriceCents` or any other price.
 * When `flags.AI_PRICING` is off, returns `[]`.
 * Pricing % rules: {@link computeDailyListingPricing} in `seasonalPricingMath`.
 */
export async function getSeasonalPricingRecommendations(
  options?: GetSeasonalPricingOptions
): Promise<SeasonalPricingRecommendation[]> {
  if (!flags.AI_PRICING) {
    return [];
  }

  const daysAhead = options?.daysAhead ?? DEFAULT_DAYS_AHEAD;
  if (daysAhead < 1) {
    return [];
  }

  const heatmap = await getDemandHeatmap();
  const byCity = new Map<string, number>();
  for (const row of heatmap) {
    byCity.set(row.city.trim().toLowerCase(), row.demandScore);
  }

  const listings = await prisma.shortTermListing.findMany({
    where: { listingStatus: ListingStatus.PUBLISHED },
    select: { id: true, city: true, nightPriceCents: true },
  });

  if (listings.length === 0) {
    return [];
  }

  const today = startOfLocalDay(new Date());
  const out: SeasonalPricingRecommendation[] = [];

  for (const listing of listings) {
    const basePrice: number | null = listing.nightPriceCents / 100;
    const cityKey = listing.city?.trim().toLowerCase() ?? null;
    const demandScore = cityKey ? (byCity.get(cityKey) ?? 0) : 0;
    const pressure = pressureFromScore(demandScore);

    for (let i = 0; i < daysAhead; i++) {
      const date = addDays(today, i);
      const dayType: DayType = isLocalWeekend(date) ? "weekend" : "weekday";
      const season = getSeasonTypeForDate(date);
      const { rounded, reason } = totalAdjustmentPercent(dayType, season, pressure);
      const suggestedPrice =
        basePrice == null
          ? null
          : Math.round(basePrice * (1 + rounded / 100) * 100) / 100;

      out.push({
        listingId: listing.id,
        city: listing.city,
        basePrice: basePrice ?? null,
        date: toYmdLocal(date),
        dayType,
        seasonType: season,
        demandPressure: pressure,
        suggestedPrice,
        suggestedAdjustmentPercent: rounded,
        reason,
      });
    }
  }

  return out.sort((a, b) => a.listingId.localeCompare(b.listingId) || a.date.localeCompare(b.date));
}
