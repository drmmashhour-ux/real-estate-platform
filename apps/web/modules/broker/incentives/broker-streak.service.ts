/**
 * Calendar-day streaks from real CRM touches — UTC dates, deterministic.
 * Resets current streak when latest activity is older than “yesterday” UTC (gap > 1 day).
 */

import type { BrokerStreak } from "./broker-incentives.types";

export type LeadTouchRow = {
  firstContactAt: Date | null;
  lastContactAt: Date | null;
  lastContactedAt: Date | null;
  lastFollowUpAt: Date | null;
  contactUnlockedAt: Date | null;
};

function utcDayFromMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function utcDayFromDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addUtcDays(dayStr: string, delta: number): string {
  const d = new Date(`${dayStr}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function collectActivityDays(leads: LeadTouchRow[]): Set<string> {
  const s = new Set<string>();
  for (const l of leads) {
    if (l.firstContactAt) s.add(utcDayFromDate(l.firstContactAt));
    if (l.lastContactAt) s.add(utcDayFromDate(l.lastContactAt));
    if (l.lastContactedAt) s.add(utcDayFromDate(l.lastContactedAt));
  }
  return s;
}

function collectFollowUpDays(leads: LeadTouchRow[]): Set<string> {
  const s = new Set<string>();
  for (const l of leads) {
    if (l.lastFollowUpAt) s.add(utcDayFromDate(l.lastFollowUpAt));
  }
  return s;
}

/** Days where a fast unlock→first-contact (≤24h) occurred on firstContact calendar day */
function collectFastResponseDays(leads: LeadTouchRow[]): Set<string> {
  const s = new Set<string>();
  for (const l of leads) {
    if (!l.contactUnlockedAt || !l.firstContactAt) continue;
    const h = (l.firstContactAt.getTime() - l.contactUnlockedAt.getTime()) / (60 * 60 * 1000);
    if (h >= 0 && h <= 24) s.add(utcDayFromDate(l.firstContactAt));
  }
  return s;
}

function latestDay(days: Set<string>): string | null {
  const arr = [...days].sort((a, b) => b.localeCompare(a));
  return arr[0] ?? null;
}

/** Best consecutive run in the last `windowDays` calendar days */
function bestConsecutiveInWindow(days: Set<string>, nowMs: number, windowDays: number): number {
  const today = utcDayFromMs(nowMs);
  let best = 0;
  for (let start = 0; start < windowDays; start++) {
    const anchor = addUtcDays(today, -start);
    let n = 0;
    let cur = anchor;
    while (days.has(cur)) {
      n++;
      cur = addUtcDays(cur, -1);
    }
    best = Math.max(best, n);
  }
  return best;
}

/**
 * Current streak: consecutive days ending at `latest`, only if `latest` is today or yesterday UTC.
 */
function currentConsecutive(days: Set<string>, nowMs: number): number {
  if (days.size === 0) return 0;
  const today = utcDayFromMs(nowMs);
  const yesterday = addUtcDays(today, -1);
  const latest = latestDay(days);
  if (!latest) return 0;
  if (latest !== today && latest !== yesterday) return 0;
  let n = 0;
  let cur = latest;
  while (days.has(cur)) {
    n++;
    cur = addUtcDays(cur, -1);
  }
  return n;
}

export function computeBrokerStreaks(leads: LeadTouchRow[], nowMs: number): BrokerStreak[] {
  const activityDays = collectActivityDays(leads);
  const followUpDays = collectFollowUpDays(leads);
  const responseDays = collectFastResponseDays(leads);

  const lastTouchMs = Math.max(
    0,
    ...leads.flatMap((l) =>
      [l.firstContactAt, l.lastContactAt, l.lastContactedAt, l.lastFollowUpAt]
        .filter(Boolean)
        .map((d) => d!.getTime()),
    ),
  );

  const lastUpdatedAt = lastTouchMs > 0 ? new Date(lastTouchMs).toISOString() : new Date(nowMs).toISOString();

  return [
    {
      type: "activity",
      currentCount: currentConsecutive(activityDays, nowMs),
      bestCount: bestConsecutiveInWindow(activityDays, nowMs, 120),
      lastUpdatedAt: lastUpdatedAt,
    },
    {
      type: "followup",
      currentCount: currentConsecutive(followUpDays, nowMs),
      bestCount: bestConsecutiveInWindow(followUpDays, nowMs, 120),
      lastUpdatedAt: lastUpdatedAt,
    },
    {
      type: "response",
      currentCount: currentConsecutive(responseDays, nowMs),
      bestCount: bestConsecutiveInWindow(responseDays, nowMs, 120),
      lastUpdatedAt: lastUpdatedAt,
    },
  ];
}
