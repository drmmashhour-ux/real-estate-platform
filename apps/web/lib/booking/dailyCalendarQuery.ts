import { parseYmdStringAsUtc } from "@/lib/dates/dateOnly";

export type ListingDailyCalendarDay = {
  date: string;
  available: boolean;
  booked: boolean;
  basePrice: number | null;
  suggestedPrice: number | null;
  adjustmentPercent: number;
  demandLevel: "low" | "medium" | "high";
  reason: string;
};

/** Inclusive; max span per Order A.2 API. */
export const MAX_CALENDAR_RANGE_DAYS = 90;

const YMD = /^\d{4}-\d{2}-\d{2}$/;

export function isValidYmd(s: string): boolean {
  return YMD.test(s.trim().slice(0, 10));
}

/**
 * Inclusive YMD list from `startYmd` to `endYmd` (UTC calendar steps — DST-safe).
 */
export function eachYmdInclusive(startYmd: string, endYmd: string): string[] {
  const a = startYmd.trim().slice(0, 10);
  const b = endYmd.trim().slice(0, 10);
  const out: string[] = [];
  const cur = parseYmdStringAsUtc(a);
  const end = parseYmdStringAsUtc(b);
  if (cur.getTime() > end.getTime()) return out;
  const x = new Date(cur);
  while (x.getTime() <= end.getTime()) {
    out.push(x.toISOString().slice(0, 10));
    x.setUTCDate(x.getUTCDate() + 1);
  }
  return out;
}

export type CalendarRangeError = { error: string; status: 400 };

/**
 * Validated inclusive range. Returns 400 errors for bad input or span &gt; {@link MAX_CALENDAR_RANGE_DAYS}.
 */
export function validateListingCalendarQuery(
  startRaw: string | null,
  endRaw: string | null
): { ok: true; startYmd: string; endYmd: string; days: string[] } | { ok: false; err: CalendarRangeError } {
  if (!startRaw?.trim() || !endRaw?.trim()) {
    return { ok: false, err: { error: "start and end are required (YYYY-MM-DD)", status: 400 } };
  }
  const startYmd = startRaw.trim().slice(0, 10);
  const endYmd = endRaw.trim().slice(0, 10);
  if (!isValidYmd(startYmd) || !isValidYmd(endYmd)) {
    return { ok: false, err: { error: "Invalid date format; use YYYY-MM-DD", status: 400 } };
  }
  const s = parseYmdStringAsUtc(startYmd);
  const e = parseYmdStringAsUtc(endYmd);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
    return { ok: false, err: { error: "Invalid dates", status: 400 } };
  }
  if (s.getTime() > e.getTime()) {
    return { ok: false, err: { error: "start must be on or before end", status: 400 } };
  }
  const days = eachYmdInclusive(startYmd, endYmd);
  if (days.length > MAX_CALENDAR_RANGE_DAYS) {
    return {
      ok: false,
      err: { error: `Range must be at most ${MAX_CALENDAR_RANGE_DAYS} days`, status: 400 },
    };
  }
  return { ok: true, startYmd, endYmd, days };
}

/**
 * A **night** is blocked if it falls in the stay window `[startYmd, endYmd)` — `endYmd` is the checkout day
 * (not occupied), aligned with `nightYmdKeysForStay` and `POST /api/bookings` payloads.
 */
export function ymdIsInStayNights(ymd: string, startYmd: string, endYmd: string): boolean {
  return ymd >= startYmd && ymd < endYmd;
}

export function ymdIsBookedByRanges(
  ymd: string,
  rows: { startYmd: string; endYmd: string }[]
): boolean {
  return rows.some((r) => ymdIsInStayNights(ymd, r.startYmd, r.endYmd));
}
