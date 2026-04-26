/**
 * Timezone-safe “calendar date” helpers (Order 61) — use with `@db.Date` in Prisma.
 */

/** Strips the time from a `Date` using the instance’s Y/M/D in local time, as UTC midnight. */
export function toDateOnly(date: Date) {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
  );
}

const YMD = /^(\d{4})-(\d{2})-(\d{2})/;

/**
 * Parse a request string (`YYYY-MM-DD` or ISO) into a date-only `Date` at **UTC** midnight
 * to avoid the “midnight in local TZ” drift from `new Date("2024-06-15")`.
 */
export function toDateOnlyFromString(input: string) {
  const s = input.trim();
  const m = s.match(YMD);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    if (Number.isFinite(y) && Number.isFinite(mo) && Number.isFinite(d)) {
      return new Date(Date.UTC(y, mo, d, 0, 0, 0, 0));
    }
  }
  return toDateOnly(new Date(s));
}

/**
 * Client / API: treat stored date strings as a fixed calendar day (UTC 00:00:00Z).
 * Order 61: `new Date(dateString + 'T00:00:00Z')` for `YYYY-MM-DD` from JSON.
 */
export function parseYmdStringAsUtc(ymd: string) {
  const d = ymd.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    return new Date(ymd);
  }
  return new Date(`${d}T00:00:00.000Z`);
}
