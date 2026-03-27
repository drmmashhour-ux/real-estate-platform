/** Normalize to UTC midnight for consistent daily bucketing. */
export function toUtcDateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function parseOptionalDateIso(iso: string | undefined): Date {
  if (!iso?.trim()) return toUtcDateOnly(new Date());
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return toUtcDateOnly(new Date());
  return toUtcDateOnly(new Date(t));
}
