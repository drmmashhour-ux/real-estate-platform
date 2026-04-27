import { toDateOnlyFromString } from "@/lib/dates/dateOnly";
import { endYmdForSameSpan } from "@/lib/booking/staySpan";
import { nightYmdKeysForStay } from "@/lib/booking/nightYmdsBetween";

const MS_PER_DAY = 86_400_000;
const SUGGESTION_HORIZON_DAYS = 365;
const NEARBY_BACK = 120;
const NEARBY_FORWARD = 365;

export type MergedYmd = { s: string; e: string };

/**
 * Merged, sorted [s,e] inclusive (YMD). Same semantics as Prisma date overlap: block.start <= stayEnd && block.end >= stayStart.
 */
export function mergeBookingYmd(rows: { startYmd: string; endYmd: string }[]): MergedYmd[] {
  if (rows.length === 0) return [];
  const inv = rows
    .map((r) => ({ s: r.startYmd, e: r.endYmd }))
    .filter((x) => x.s <= x.e);
  inv.sort((a, b) => a.s.localeCompare(b.s) || a.e.localeCompare(b.e));
  const out: MergedYmd[] = [];
  for (const x of inv) {
    const last = out[out.length - 1];
    if (!last || x.s > last.e) {
      out.push({ ...x });
    } else {
      last.e = x.e > last.e ? x.e : last.e;
    }
  }
  return out;
}

function stayOverlapsBlock(stay: MergedYmd, m: MergedYmd): boolean {
  return m.s <= stay.e && m.e >= stay.s;
}

export function stayFree(merged: MergedYmd[], stay: MergedYmd): boolean {
  return !merged.some((b) => stayOverlapsBlock(stay, b));
}

export function addUtcDays(dayYmd: string, n: number): string {
  const t = toDateOnlyFromString(dayYmd);
  const x = new Date(t.getTime() + n * MS_PER_DAY);
  return toYmdString(x);
}

function toYmdString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Suggestion window for one query: one load covers next-scan + nearest-scan.
 */
export function suggestionQueryWindow(anchorYmd: string): { fromY: string; toY: string } {
  const a = anchorYmd.slice(0, 10);
  return {
    fromY: addUtcDays(a, -200),
    toY: addUtcDays(a, 500),
  };
}

/**
 * Smallest S ≥ `startYmd` where the stay (same span as start..end) is free. One DB query worth of `merged` rows.
 */
export function scanNextAvailableStart(merged: MergedYmd[], startYmd: string, endYmd: string): string | null {
  const start = startYmd.slice(0, 10);
  const end = endYmd.slice(0, 10);
  for (let i = 0; i <= SUGGESTION_HORIZON_DAYS; i++) {
    const s = addUtcDays(start, i);
    const e = endYmdForSameSpan(start, end, s);
    if (stayFree(merged, { s, e })) {
      return s;
    }
  }
  return null;
}

/**
 * 2–3 closest free windows; distance = |offset days from anchor start| (scan d ∈ [-120, 365]).
 */
export function scanNearestAvailableRanges(
  merged: MergedYmd[],
  startYmd: string,
  endYmd: string,
  maxResults = 3
): { startDate: string; endDate: string }[] {
  const start = startYmd.slice(0, 10);
  const end = endYmd.slice(0, 10);
  if (nightYmdKeysForStay(start, end).length === 0) return [];

  const cands: { startDate: string; endDate: string; dist: number }[] = [];
  for (let d = -NEARBY_BACK; d <= NEARBY_FORWARD; d++) {
    const s = addUtcDays(start, d);
    const e = endYmdForSameSpan(start, end, s);
    if (stayFree(merged, { s, e })) {
      cands.push({ startDate: s, endDate: e, dist: Math.abs(d) });
    }
  }

  cands.sort((a, b) => a.dist - b.dist || a.startDate.localeCompare(b.startDate));
  const out: { startDate: string; endDate: string }[] = [];
  const seen = new Set<string>();
  for (const c of cands) {
    const k = `${c.startDate}/${c.endDate}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ startDate: c.startDate, endDate: c.endDate });
    if (out.length >= maxResults) break;
  }
  return out;
}
