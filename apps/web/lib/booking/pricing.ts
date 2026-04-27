import "server-only";

import { getListingDailyCalendar } from "@/lib/booking/dailyCalendar";
import { nightYmdKeysForStay } from "@/lib/booking/nightYmdsBetween";
import { platformFeeCentsFromSubtotal } from "@/lib/pricing/calculateTotal";
import { calculateDynamicTotal } from "@/lib/pricing/calculateDynamicTotal";

/**
 * Server-only quote for a stay. **Not** a substitute for `POST /api/checkout` or payment — always re-validate
 * dates and recompute totals (or a signed quote id) on the server at booking/create time (Order D.2 / 60+).
 */
export type BookingPriceBreakdown = {
  nights: number;
  /** One entry per **occupied** night (check-out YMD is excluded; same as `nightYmdKeysForStay`). */
  nightly: number[];
  baseSubtotal: number;
  /** Future: from listing/region when model exposes it. */
  cleaningFee: number;
  /** 10% of subtotal, same as {@link platformFeeCentsFromSubtotal} on integer cents. */
  serviceFee: number;
  /** Stub 0 — replace with region/jurisdiction when rules exist. */
  taxes: number;
  total: number;
  currency: string;
  /**
   * `false` if any night in the range overlaps a blocking booking in the daily calendar.
   * Still returns line items so UI can show “why it failed” with numbers.
   */
  allNightsAvailable: boolean;
  /**
   * Order 61 — per-night dynamic detail (cents) when the dynamic engine produced the quote.
   */
  dynamicNightlyCents?: { date: string; priceCents: number; adjustmentPercent: number; reasons: string[] }[];
};

function roundMoney(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

/**
 * 10% platform service fee on the stay subtotal (major units), matching `lib/pricing/calculateTotal` (Order 60).
 */
export function calculateFee(baseSubtotal: number): number {
  const cents = Math.round(Math.max(0, baseSubtotal) * 100);
  return platformFeeCentsFromSubtotal(cents) / 100;
}

export type GetBookingPriceBreakdownInput = {
  listingId: string;
  startDate: string;
  endDate: string;
};

/**
 * Returns `null` if listing is missing, dates invalid, or there are no billable nights.
 * Uses **Order 61** `calculateDynamicTotal` (daily rules) for money and `getListingDailyCalendar` for
 * availability. Checkout must still send `expected_amount_cents` matching the server recompute.
 */
export async function getBookingPriceBreakdown(
  input: GetBookingPriceBreakdownInput
): Promise<BookingPriceBreakdown | null> {
  const listingId = input.listingId?.trim();
  const start = input.startDate?.trim().slice(0, 10);
  const end = input.endDate?.trim().slice(0, 10);
  if (!listingId || !start || !end) return null;
  if (end <= start) return null;

  const nightKeys = nightYmdKeysForStay(start, end);
  if (nightKeys.length === 0) return null;

  const first = nightKeys[0]!;
  const last = nightKeys[nightKeys.length - 1]!;

  const [dyn, dayRows] = await Promise.all([
    calculateDynamicTotal({ listingId, startDate: start, endDate: end }),
    getListingDailyCalendar(listingId, first, last),
  ]);
  if (!dyn) return null;
  const byDate = new Map(dayRows.map((d) => [d.date, d]));

  const taxes = 0;
  const cleaningFee = 0;
  const currency = "USD";

  const nightly: number[] = [];
  let allNightsAvailable = true;

  for (let i = 0; i < nightKeys.length; i++) {
    const ymd = nightKeys[i]!;
    const d = byDate.get(ymd);
    if (d?.booked) allNightsAvailable = false;
    const line = dyn.nightlyPrices[i];
    if (line) {
      nightly.push(roundMoney(line.priceCents / 100));
    } else {
      nightly.push(0);
    }
  }

  const baseSubtotal = roundMoney(dyn.subtotalCents / 100);
  const serviceFee = roundMoney(dyn.platformFeeCents / 100);
  const total = roundMoney(dyn.finalCents / 100);

  return {
    nights: nightKeys.length,
    nightly,
    baseSubtotal,
    cleaningFee,
    serviceFee,
    taxes,
    total,
    currency,
    allNightsAvailable,
    dynamicNightlyCents: dyn.nightlyPrices,
  };
}
