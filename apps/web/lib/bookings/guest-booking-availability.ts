/**
 * Server-side nightly availability for guest Supabase `bookings` (matches mobile `bookingAvailability.ts`).
 */

export function parseBookingDatesArray(dates: unknown): string[] {
  if (!Array.isArray(dates)) return [];
  return dates.filter((d): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d));
}

export type BookingRowForAvailability = {
  dates: unknown;
  status?: string | null;
};

export function flattenBookedNights(rows: BookingRowForAvailability[]): string[] {
  const set = new Set<string>();
  for (const row of rows) {
    const st = (row.status ?? "pending").toLowerCase();
    // Canceled releases dates; pending/processing/paid/completed all hold nights.
    if (st === "canceled" || st === "cancelled") continue;
    for (const d of parseBookingDatesArray(row.dates)) {
      set.add(d);
    }
  }
  return [...set];
}

export function hasDateOverlap(selected: string[], existing: string[]): boolean {
  return selected.some((d) => existing.includes(d));
}

/** UTC midnight math consistent with mobile `nightDateStrings`. */
export function isNextCalendarDay(prevYmd: string, nextYmd: string): boolean {
  const a = new Date(`${prevYmd}T12:00:00.000Z`).getTime();
  const b = new Date(`${nextYmd}T12:00:00.000Z`).getTime();
  return b - a === 86_400_000;
}

/**
 * Validates non-empty YYYY-MM-DD array: unique, sorted, consecutive (checkout-exclusive stay nights).
 */
export function normalizeConsecutiveSelectedNights(raw: unknown):
  | { ok: true; nights: string[] }
  | { ok: false; error: string } {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { ok: false, error: "selectedDates must be a non-empty array of YYYY-MM-DD strings." };
  }
  const dates: string[] = [];
  for (const x of raw) {
    if (typeof x !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(x)) {
      return { ok: false, error: "Each selected date must be a YYYY-MM-DD string." };
    }
    dates.push(x);
  }
  const sorted = [...new Set(dates)].sort();
  if (sorted.length !== dates.length) {
    return { ok: false, error: "Duplicate nights are not allowed." };
  }
  for (let i = 1; i < sorted.length; i++) {
    if (!isNextCalendarDay(sorted[i - 1]!, sorted[i]!)) {
      return {
        ok: false,
        error: "Selected nights must be consecutive (check-out day is not charged).",
      };
    }
  }
  return { ok: true, nights: sorted };
}
