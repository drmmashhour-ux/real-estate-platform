/**
 * Compare nightly date strings (YYYY-MM-DD). True if any night in `selected` appears in `existing`
 * (typically the flattened set of already-booked nights for a listing).
 */
export function hasDateOverlap(selected: string[], existing: string[]): boolean {
  return selected.some((d) => existing.includes(d));
}

/**
 * Server-side overlap enforcement for **new** bookings: `POST /api/bookings/create` (apps/web).
 * Optional local hints may still use these helpers; they are not the source of truth.
 * Remaining: DB-level locking / exclusion for concurrent races at insert time.
 */

/** Parse `dates` jsonb from a booking row into nightly strings. */
export function parseBookingDatesArray(dates: unknown): string[] {
  if (!Array.isArray(dates)) return [];
  return dates.filter((d): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d));
}

export type BookingRowForAvailability = {
  dates: unknown;
  status?: string | null;
};

/** Flatten booked nights from rows, ignoring canceled bookings. */
export function flattenBookedNights(rows: BookingRowForAvailability[]): string[] {
  const set = new Set<string>();
  for (const row of rows) {
    const st = (row.status ?? "pending").toLowerCase();
    if (st === "canceled" || st === "cancelled") continue;
    for (const d of parseBookingDatesArray(row.dates)) {
      set.add(d);
    }
  }
  return [...set];
}

export function selectedNightsConflict(selected: string[], bookedNights: string[]): boolean {
  return hasDateOverlap(selected, bookedNights);
}
