/**
 * UTC calendar boundaries for admin / finance reporting (consistent across sessions).
 */

export function startOfUtcDay(d: Date): Date {
  const x = new Date(d.getTime());
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

/** Monday 00:00:00 UTC of the ISO week containing `d`. */
export function startOfUtcIsoWeekMonday(d: Date): Date {
  const x = new Date(d.getTime());
  const dow = x.getUTCDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  x.setUTCDate(x.getUTCDate() + offset);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

/** First day of month, 00:00:00 UTC. */
export function startOfUtcMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}
