/**
 * Lightweight in-memory daily counters for operator execution (merged with DB-derived stats).
 * Resets per UTC day key; not durable across deploys — use for supplemental tracking only.
 */

export type DailyActionCounters = {
  brokersContacted: number;
  followUpsSent: number;
  leadsShown: number;
  leadsSold: number;
};

const empty = (): DailyActionCounters => ({
  brokersContacted: 0,
  followUpsSent: 0,
  leadsShown: 0,
  leadsSold: 0,
});

const byDay = new Map<string, DailyActionCounters>();

export function utcDayKey(d = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getOrCreate(dayKey: string): DailyActionCounters {
  let row = byDay.get(dayKey);
  if (!row) {
    row = empty();
    byDay.set(dayKey, row);
  }
  return row;
}

/** Read overlay for a UTC day (for merging with DB stats). */
export function getDailyActionOverlay(dayKey: string): DailyActionCounters {
  return { ...(byDay.get(dayKey) ?? empty()) };
}

/** Increment counters — optional hook for future POST / execution helpers (additive). */
export function addDailyActionOverlay(
  dayKey: string,
  partial: Partial<Pick<DailyActionCounters, keyof DailyActionCounters>>,
): DailyActionCounters {
  const row = getOrCreate(dayKey);
  if (partial.brokersContacted != null) row.brokersContacted += Math.max(0, partial.brokersContacted);
  if (partial.followUpsSent != null) row.followUpsSent += Math.max(0, partial.followUpsSent);
  if (partial.leadsShown != null) row.leadsShown += Math.max(0, partial.leadsShown);
  if (partial.leadsSold != null) row.leadsSold += Math.max(0, partial.leadsSold);
  return { ...row };
}
