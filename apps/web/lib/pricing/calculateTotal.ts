import { parseYmdStringAsUtc } from "@/lib/dates/dateOnly";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const DEFAULT_FEE_RATE = 0.1;

/**
 * Order 61: `YYYY-MM-DD` as UTC calendar midnight (matches `@db.Date` / API strings).
 * Avoids local-TZ off-by-one vs `new Date("YYYY-MM-DD")`.
 */
export function dateFromYmd(ymd: string): Date {
  return parseYmdStringAsUtc(ymd);
}

/**
 * Subtotal in **major units** (e.g. dollars) before fees.
 * `nights` = (end - start) in whole days; `Math.round(nights * pricePerNight)`.
 * If the span is non‑positive, charges **one** night so checkout never resolves to 0.
 */
export function calculateTotalPrice(start: Date, end: Date, pricePerNight: number) {
  const nights = (end.getTime() - start.getTime()) / MS_PER_DAY;
  if (nights <= 0) {
    return Math.round(pricePerNight);
  }
  return Math.round(nights * pricePerNight);
}

/**
 * 10% platform fee on the subtotal in **minor units (cents)**; rounded to an integer.
 */
export function platformFeeCentsFromSubtotal(subtotalCents: number) {
  return Math.round(subtotalCents * DEFAULT_FEE_RATE);
}

/**
 * `subtotalCents` + 10% fee (Order 60).
 */
export function totalWithPlatformFeeCents(subtotalCents: number) {
  const fee = platformFeeCentsFromSubtotal(subtotalCents);
  return { subtotalCents, feeCents: fee, finalCents: subtotalCents + fee };
}
