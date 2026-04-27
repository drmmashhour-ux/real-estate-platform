import { dateFromYmd } from "@/lib/pricing/calculateTotal";

const MS_PER_DAY = 86_400_000;

function stayNightsFromRangeMs(start: Date, end: Date): number {
  const n = (end.getTime() - start.getTime()) / MS_PER_DAY;
  if (n <= 0) return 1;
  return Math.max(1, Math.round(n));
}

/**
 * Number of billable nights for a stay (same as length of `nightYmdKeysForStay` for valid ranges).
 * Order 65 — use with marketplace booking snapshots.
 */
export function countNightsForStayRange(start: Date, end: Date): number {
  return stayNightsFromRangeMs(start, end);
}

/**
 * YMD keys for each night in the stay window, aligned with `stayNightsFromRange` on the book page.
 */
export function nightYmdKeysForStay(startYmd: string, endYmd: string): string[] {
  if (!startYmd || !endYmd) return [];
  const start = dateFromYmd(startYmd);
  const end = dateFromYmd(endYmd);
  const n = stayNightsFromRangeMs(start, end);
  const out: string[] = [];
  const cur = new Date(start.getTime());
  for (let i = 0; i < n; i++) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}
