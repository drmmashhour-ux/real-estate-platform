import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { eachNightBetween, utcDayStart } from "@/lib/bnhub/availability-day-helpers";
import { applyPricingSuggestion } from "@/modules/pricing/pricing-apply.service";

export type BnhubPricingSuggestionRow = {
  listingId: string;
  date: Date;
  suggested: number;
  basePrice: number;
  demandScore: number;
  reason: string;
  status: "pending" | "approved";
};

const HORIZON_DAYS = 30;

const EXCLUDED_FROM_OCCUPANCY: BookingStatus[] = [
  BookingStatus.CANCELLED_BY_GUEST,
  BookingStatus.CANCELLED_BY_HOST,
  BookingStatus.CANCELLED,
  BookingStatus.DECLINED,
  BookingStatus.EXPIRED,
];

function nightOverlapsBooking(night: Date, b: { checkIn: Date; checkOut: Date }): boolean {
  const d0 = utcDayStart(night);
  const d1 = new Date(d0.getTime() + 86400000);
  return b.checkIn < d1 && b.checkOut > d0;
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function deriveInitialSuggestionStatus(
  pricingMode: string,
  suggested: number,
  baseDollars: number,
  autoApplyMaxChange: number | null
): "pending" | "approved" {
  if (pricingMode === "OFF" || pricingMode === "MANUAL") return "pending";
  if (pricingMode === "FULL_AUTOPILOT") return "approved";

  if (pricingMode === "AUTO_APPROVE_SAFE") {
    if (baseDollars <= 0) return "pending";
    const diff = Math.abs(suggested - baseDollars) / baseDollars;
    if (!autoApplyMaxChange || diff <= autoApplyMaxChange) return "approved";
    return "pending";
  }

  return "pending";
}

function shouldAttemptCronAutoApply(pricingMode: string, indexInHorizon: number): boolean {
  if (pricingMode === "OFF" || pricingMode === "MANUAL") return false;
  /** Single published nightly rate: auto-apply at most once per run (tonight / first row). */
  return indexInHorizon === 0;
}

/**
 * Rule-based nightly suggestions for the next 30 days.
 * Honors `pricingMode` for initial row status; optional safe auto-apply for **tonight only** when approved.
 */
export async function generatePricing(listingId: string): Promise<BnhubPricingSuggestionRow[] | null> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
  });

  if (!listing || !listing.pricingSuggestionsEnabled) {
    return null;
  }

  const baseDollars = roundMoney(listing.nightPriceCents / 100);
  const minD = listing.pricingMinNightDollars != null ? roundMoney(listing.pricingMinNightDollars) : null;
  const maxD = listing.pricingMaxNightDollars != null ? roundMoney(listing.pricingMaxNightDollars) : null;

  const today = utcDayStart(new Date());
  const horizonEnd = new Date(today.getTime() + HORIZON_DAYS * 86400000);

  const relevantBookings = await prisma.booking.findMany({
    where: {
      listingId,
      status: { notIn: EXCLUDED_FROM_OCCUPANCY },
      checkOut: { gt: today },
      checkIn: { lt: horizonEnd },
    },
    select: { checkIn: true, checkOut: true, status: true },
  });

  const bookedNightKeys = new Set<string>();
  for (const b of relevantBookings) {
    for (const n of eachNightBetween(b.checkIn, b.checkOut)) {
      if (n >= today && n < horizonEnd) {
        bookedNightKeys.add(n.toISOString().slice(0, 10));
      }
    }
  }
  const occupancyRate = Math.min(1, Math.max(0, bookedNightKeys.size / HORIZON_DAYS));

  await prisma.bnhubPricingSuggestion.deleteMany({
    where: {
      listingId,
      date: {
        gte: today,
        lt: horizonEnd,
      },
    },
  });

  const out: BnhubPricingSuggestionRow[] = [];

  for (let i = 0; i < HORIZON_DAYS; i++) {
    const night = new Date(today.getTime() + i * 86400000);
    const dayOfWeek = night.getUTCDay();
    const month = night.getUTCMonth();

    const bookedTonight = relevantBookings.some((b) => nightOverlapsBooking(night, b));

    const demandScore = Math.min(
      1,
      Math.max(0, 0.65 * occupancyRate + (bookedTonight ? 0.35 : 0))
    );

    let multiplier = 1;
    const parts: string[] = [];

    if (dayOfWeek === 5 || dayOfWeek === 6) {
      multiplier += 0.2;
      parts.push("Weekend uplift (+20%)");
    }

    if (occupancyRate < 0.25) {
      multiplier -= 0.15;
      parts.push(`Low occupancy (${Math.round(occupancyRate * 100)}%) discount (−15%)`);
    } else if (occupancyRate > 0.65) {
      multiplier += 0.1;
      parts.push(`Strong occupancy (${Math.round(occupancyRate * 100)}%) uplift (+10%)`);
    }

    if (bookedTonight) {
      parts.push("This night is booked in BNHub calendar (demand signal)");
    }

    if (i < 3) {
      multiplier += 0.1;
      parts.push("Last-minute horizon (+10%)");
    }

    if (month >= 5 && month <= 7) {
      multiplier += 0.05;
      parts.push("Peak summer season (+5%)");
    }

    multiplier = Math.max(0.55, multiplier);

    let suggested = roundMoney(baseDollars * multiplier);

    if (minD != null && suggested < minD) {
      parts.push(`Clamped to minimum ($${minD})`);
      suggested = minD;
    }
    if (maxD != null && suggested > maxD) {
      parts.push(`Clamped to maximum ($${maxD})`);
      suggested = maxD;
    }

    const reason =
      `Base $${baseDollars.toFixed(2)} × ${multiplier.toFixed(2)}. ${parts.join(" ")}`.trim();

    const status = deriveInitialSuggestionStatus(
      listing.pricingMode,
      suggested,
      baseDollars,
      listing.autoApplyMaxChange
    );

    const created = await prisma.bnhubPricingSuggestion.create({
      data: {
        listingId,
        date: utcDayStart(night),
        suggested,
        basePrice: baseDollars,
        demandScore,
        reason,
        status,
      },
    });

    out.push({
      listingId,
      date: utcDayStart(night),
      suggested,
      basePrice: baseDollars,
      demandScore,
      reason,
      status,
    });

    const tryAuto =
      status === "approved" && shouldAttemptCronAutoApply(listing.pricingMode, i);

    if (tryAuto) {
      await applyPricingSuggestion(created.id, { actor: "cron_auto" });
    }
  }

  return out;
}

/** Batch: all BNHub listings with `pricingSuggestionsEnabled`. */
export async function generatePricingForEnabledListings(): Promise<{ listingCount: number; rowsPerListing: number }> {
  const listings = await prisma.shortTermListing.findMany({
    where: { pricingSuggestionsEnabled: true },
    select: { id: true },
  });

  for (const { id } of listings) {
    try {
      await generatePricing(id);
    } catch {
      /* non-fatal batch */
    }
  }

  return { listingCount: listings.length, rowsPerListing: HORIZON_DAYS };
}
