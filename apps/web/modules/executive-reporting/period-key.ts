/**
 * Period bounds for executive reports. Ranges are half-open: [startUtc, endUtcExclusive).
 * Weekly keys use ISO week-year and ISO week number in UTC (e.g. 2026-W17).
 */

export type ParsedPeriod = {
  periodKey: string;
  kind: "MONTHLY" | "WEEKLY";
  startUtc: Date;
  endUtcExclusive: Date;
};

function utcMondayOfIsoWeek(weekYear: number, week: number): Date {
  const jan4 = new Date(Date.UTC(weekYear, 0, 4));
  const dow = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - dow + 1);
  const out = new Date(week1Monday);
  out.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
  return out;
}

/** ISO week-year and week for a calendar UTC date. */
export function utcIsoWeekKeyParts(d: Date): { weekYear: number; week: number } {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const thu = new Date(t);
  const dow = thu.getUTCDay() || 7;
  thu.setUTCDate(t.getUTCDate() + 4 - dow);
  const isoYear = thu.getUTCFullYear();
  const week1Mon = utcMondayOfIsoWeek(isoYear, 1);
  const week = Math.floor((t.getTime() - week1Mon.getTime()) / (7 * 86400000)) + 1;
  return { weekYear: isoYear, week };
}

export function formatUtcIsoWeekKey(d: Date): string {
  const { weekYear, week } = utcIsoWeekKeyParts(d);
  return `${weekYear}-W${String(week).padStart(2, "0")}`;
}

export function formatUtcMonthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function parsePeriodKey(periodKey: string): ParsedPeriod | null {
  const month = /^(\d{4})-(\d{2})$/.exec(periodKey.trim());
  if (month) {
    const y = Number(month[1]);
    const m = Number(month[2]);
    if (m < 1 || m > 12) return null;
    const startUtc = new Date(Date.UTC(y, m - 1, 1));
    const endUtcExclusive = new Date(Date.UTC(y, m, 1));
    return { periodKey, kind: "MONTHLY", startUtc, endUtcExclusive };
  }

  const week = /^(\d{4})-W(\d{2})$/.exec(periodKey.trim());
  if (week) {
    const weekYear = Number(week[1]);
    const w = Number(week[2]);
    if (w < 1 || w > 53) return null;
    const startUtc = utcMondayOfIsoWeek(weekYear, w);
    const endUtcExclusive = new Date(startUtc.getTime() + 7 * 86400000);
    return { periodKey, kind: "WEEKLY", startUtc, endUtcExclusive };
  }

  return null;
}

export function previousPeriodBounds(cur: ParsedPeriod): { startUtc: Date; endUtcExclusive: Date } {
  if (cur.kind === "MONTHLY") {
    const end = cur.startUtc;
    const startUtc = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 1, 1));
    return { startUtc, endUtcExclusive: end };
  }
  const startUtc = new Date(cur.startUtc.getTime() - 7 * 86400000);
  return { startUtc, endUtcExclusive: cur.startUtc };
}
