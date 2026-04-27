/**
 * Pure helpers for 7-day launch plan — safe to import from client tests (no DB).
 */

const DAY_MS = 86_400_000;
const MAX_DAY = 7;

/** 1–7 from an anchor start (inclusive of start day), UTC midnight alignment. Order 50 + launch checklist. */
export function computeCurrentDayFromStart(startedAt: Date, now: Date = new Date()): number {
  const s = new Date(startedAt);
  s.setUTCHours(0, 0, 0, 0);
  const t = new Date(now);
  t.setUTCHours(0, 0, 0, 0);
  const diff = Math.floor((t.getTime() - s.getTime()) / DAY_MS) + 1;
  return Math.min(MAX_DAY, Math.max(1, diff));
}

/**
 * 1 = days 1–3 (Order 49.1), 2 = 4–5, 3 = 6–7.
 */
export function getLaunchPhaseBand(userIdDay: number): 1 | 2 | 3 {
  const d = Math.min(7, Math.max(1, Math.floor(userIdDay) || 1));
  if (d <= 3) return 1;
  if (d <= 5) return 2;
  return 3;
}
