/** UTC helpers + safe math — deterministic server-side aggregates. */

export function startOfUtcDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function addUtcDays(date: Date, delta: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + delta);
  return d;
}

/**
 * Inclusive calendar window [rangeStartUtc, rangeEndUtc] converted to `[start, endExclusive)`
 * where `rangeEndUtc` is the last calendar day to include.
 */
export function bnhubUtcWindowInclusiveEnd(
  rangeStart: Date,
  rangeEndInclusive: Date
): { windowStart: Date; windowEndExclusive: Date; availableNightsSingleUnit: number } {
  const windowStart = startOfUtcDay(rangeStart);
  const lastDay = startOfUtcDay(rangeEndInclusive);
  const windowEndExclusive = addUtcDays(lastDay, 1);
  const ms = windowEndExclusive.getTime() - windowStart.getTime();
  const availableNightsSingleUnit = Math.max(1, Math.round(ms / 86400000));
  return { windowStart, windowEndExclusive, availableNightsSingleUnit };
}

export function safeDivide(value: number, by: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(by) || by <= 0) return 0;
  return value / by;
}

export function round2(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}
