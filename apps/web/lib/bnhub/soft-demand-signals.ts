/**
 * Short, optional demand hints for BNHUB booking UI — only when backed by platform data.
 */

import type { BnhubMarketInsightPayload } from "@/lib/bnhub/market-price-insight";
import { prisma } from "@/lib/db";

/** Minimum slot coverage before inferring calendar pressure. */
const MIN_CALENDAR_SAMPLES = 14;
/** Share of host-maintained nights that are blocked/booked — high = scarce. */
const TIGHT_RATIO = 0.48;

export type SoftDemandInsightInput = Pick<
  BnhubMarketInsightPayload,
  "demandLevel" | "peerBookingsLast30dInCity" | "peerListingCount" | "listingBookingsLast30d"
>;

/**
 * Listing-level + city-level activity (no dates). At most one line; null if nothing notable.
 */
export function resolveSoftDemandLineFromInsight(input: SoftDemandInsightInput): string | null {
  const { demandLevel, peerBookingsLast30dInCity, peerListingCount, listingBookingsLast30d } = input;

  if (listingBookingsLast30d >= 3) {
    return "This listing is in high demand.";
  }
  if (demandLevel === "high" && peerListingCount >= 4) {
    return "Booked frequently in this area.";
  }
  if (
    peerBookingsLast30dInCity >= 18 &&
    peerListingCount >= 6 &&
    demandLevel !== "low"
  ) {
    return "Booked frequently in this area.";
  }
  return null;
}

/**
 * Date-range hint when the host calendar has enough rows and many nights around the stay are taken.
 */
export async function softDemandLineForQuoteRange(
  listingId: string,
  checkIn: string,
  checkOut: string
): Promise<string | null> {
  const start = new Date(`${checkIn}T12:00:00.000Z`);
  const end = new Date(`${checkOut}T12:00:00.000Z`);
  if (!(start < end)) return null;

  const padStart = new Date(start);
  padStart.setUTCDate(padStart.getUTCDate() - 10);
  const padEnd = new Date(end);
  padEnd.setUTCDate(padEnd.getUTCDate() + 10);

  const slots = await prisma.availabilitySlot.findMany({
    where: { listingId, date: { gte: padStart, lt: padEnd } },
    select: { available: true, dayStatus: true },
  });

  if (slots.length < MIN_CALENDAR_SAMPLES) return null;

  let blocked = 0;
  for (const s of slots) {
    if (!s.available || s.dayStatus === "BLOCKED" || s.dayStatus === "BOOKED") {
      blocked += 1;
    }
  }
  const ratio = blocked / slots.length;
  if (ratio >= TIGHT_RATIO) {
    return "Limited availability for your dates.";
  }
  return null;
}
