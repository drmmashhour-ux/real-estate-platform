import { BookingStatus } from "@prisma/client";
import { differenceInCalendarDays, max as maxDate, min as minDate, subDays } from "date-fns";
import { prisma } from "@repo/db";
import { loadBnhubPricingSignals } from "@/modules/bnhub/pricing/bnhub-pricing-signals.service";
import { loadPeerMedians } from "./competitor.engine";
import type { PricingAiListingInput, PricingAiSignalBundle, PricingAiDemandLevel } from "./signals.types";

const OCC_WINDOW_DAYS = 30;

function demandLevelTo01(level: PricingAiDemandLevel): number {
  if (level === "high") return 0.78;
  if (level === "low") return 0.24;
  return 0.52;
}

/** Calendar month seasonality — conservative, explainable; not a black box. */
export function seasonalityFactorForDate(d: Date): number {
  const m = d.getMonth();
  if (m === 5 || m === 6 || m === 7) return 1.05;
  if (m === 11) return 1.04;
  if (m === 0 || m === 1) return 0.98;
  return 1;
}

function overlapNights(checkIn: Date, checkOut: Date, rangeStart: Date, rangeEnd: Date): number {
  const start = maxDate([checkIn, rangeStart]);
  const end = minDate([checkOut, rangeEnd]);
  const n = differenceInCalendarDays(end, start);
  return Math.max(0, n);
}

async function loadOccupancy01(listingId: string): Promise<number | null> {
  const rangeEnd = new Date();
  const rangeStart = subDays(rangeEnd, OCC_WINDOW_DAYS);
  const statuses: BookingStatus[] = [
    BookingStatus.CONFIRMED,
    BookingStatus.COMPLETED,
    BookingStatus.AWAITING_HOST_APPROVAL,
  ];

  const bookings = await prisma.booking.findMany({
    where: {
      listingId,
      status: { in: statuses },
      checkOut: { gt: rangeStart },
      checkIn: { lt: rangeEnd },
    },
    select: { checkIn: true, checkOut: true },
    take: 500,
  });

  /** No stays in window — treat as unknown so new listings are not pushed to fire-sale pricing. */
  if (bookings.length === 0) return null;

  let occupied = 0;
  for (const b of bookings) {
    occupied += overlapNights(b.checkIn, b.checkOut, rangeStart, rangeEnd);
  }
  return Math.min(1, occupied / OCC_WINDOW_DAYS);
}

export type BuildPricingAiSignalsOptions = {
  checkIn?: Date | null;
  /** Optional 0–1 demand boost (conventions, sports, host-provided). */
  eventDemand01?: number;
};

/**
 * Loads listing row + funnel + comps + occupancy for the pricing engines.
 */
export async function buildPricingAiSignalBundle(
  listingRow: PricingAiListingInput,
  opts?: BuildPricingAiSignalsOptions,
): Promise<PricingAiSignalBundle> {
  const loaded = await loadBnhubPricingSignals(listingRow.id).catch(() => null);
  const peers = await loadPeerMedians(listingRow);
  const occupancyRate01 = await loadOccupancy01(listingRow.id);

  const funnel = loaded?.funnel;
  const demandLevelLabel: PricingAiDemandLevel = funnel?.demandLevel ?? "medium";
  const views = funnel?.listingViews ?? 0;
  const starts = funnel?.bookingStarts ?? 0;
  const v2s = funnel?.viewToStartRate ?? 0;

  const demand01 =
    0.55 * demandLevelTo01(demandLevelLabel) +
    0.25 * Math.min(1, views / 120) +
    0.2 * Math.min(1, v2s * 8);

  const anchorDate = opts?.checkIn && !Number.isNaN(opts.checkIn.getTime()) ? opts.checkIn : new Date();
  const seasonalityFactor = seasonalityFactorForDate(anchorDate);

  let bookingLeadTimeDays: number | null = null;
  if (opts?.checkIn && !Number.isNaN(opts.checkIn.getTime())) {
    bookingLeadTimeDays = Math.max(0, Math.ceil((opts.checkIn.getTime() - Date.now()) / 86_400_000));
  }

  const eventDemand01 =
    opts?.eventDemand01 != null && Number.isFinite(opts.eventDemand01)
      ? Math.min(1, Math.max(0, opts.eventDemand01))
      : 0;

  return {
    basePriceCents: listingRow.nightPriceCents,
    locationDemand01: Math.min(1, Math.max(0, demand01)),
    seasonalityFactor,
    nearbyListingMedianCents: peers.cityMedianCents,
    nearbyListingSampleSize: peers.citySampleSize,
    similarPropertyMedianCents: peers.similarMedianCents,
    similarPropertySampleSize: peers.similarSampleSize,
    occupancyRate01,
    bookingLeadTimeDays,
    eventDemand01,
    listingViews30d: views,
    bookingStarts30d: starts,
    viewToStartRate: v2s,
    demandLevelLabel,
  };
}
