import { colors } from "../theme/colors";

export type StayMarked = Record<
  string,
  { color: string; textColor: string; startingDay?: boolean; endingDay?: boolean }
>;

/** Nights between check-in (inclusive) and check-out (exclusive), e.g. Jan 1 → Jan 4 = 3. */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const start = new Date(`${checkIn}T12:00:00Z`).getTime();
  const end = new Date(`${checkOut}T12:00:00Z`).getTime();
  if (!(end > start)) return 0;
  return Math.round((end - start) / 86_400_000);
}

/**
 * Each calendar date (YYYY-MM-DD) for a stayed night, check-out exclusive.
 * Source of truth for what is stored in `public.bookings.dates` (JSON array).
 */
export function nightDateStrings(checkIn: string, checkOut: string): string[] {
  const n = nightsBetween(checkIn, checkOut);
  if (n <= 0) return [];
  const start = new Date(`${checkIn}T12:00:00Z`);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

/** Period marking for react-native-calendars (each night stayed). */
export function buildStayMarkedDates(checkIn: string, checkOut: string): StayMarked {
  const n = nightsBetween(checkIn, checkOut);
  if (n <= 0) return {};

  const marked: StayMarked = {};
  const start = new Date(`${checkIn}T12:00:00Z`);

  for (let i = 0; i < n; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    const ds = d.toISOString().slice(0, 10);
    if (n === 1) {
      marked[ds] = {
        color: colors.gold,
        textColor: "#0a0a0a",
        startingDay: true,
        endingDay: true,
      };
    } else if (i === 0) {
      marked[ds] = { color: colors.gold, textColor: "#0a0a0a", startingDay: true };
    } else if (i === n - 1) {
      marked[ds] = { color: colors.gold, textColor: "#0a0a0a", endingDay: true };
    } else {
      marked[ds] = { color: colors.gold, textColor: "#0a0a0a" };
    }
  }

  return marked;
}

/** Single selected day (check-in only, before check-out is chosen). */
export function buildCheckInOnlyMarked(checkIn: string): StayMarked {
  return {
    [checkIn]: {
      color: colors.gold,
      textColor: "#0a0a0a",
      startingDay: true,
      endingDay: true,
    },
  };
}
