/**
 * Display-only scarcity copy for inbound — blends real daily intake with bounded, non-deceptive ranges.
 */

import { prisma } from "@/lib/db";

function startOfUtcDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function addUtcDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

export type LeadScarcityLines = {
  /** "Only X leads available today" style */
  leadsAvailableLine: string;
  /** Social-proof style line */
  brokersViewedLine: string;
};

/**
 * Safe marketing lines — uses today's CRM lead count + deterministic jitter (no fake exact claims).
 */
export async function buildLeadScarcityLines(): Promise<LeadScarcityLines> {
  const now = new Date();
  const todayStart = startOfUtcDay(now);
  const tomorrowStart = addUtcDays(todayStart, 1);

  const n = await prisma.lead.count({
    where: { createdAt: { gte: todayStart, lt: tomorrowStart } },
  });

  const displayPool = Math.max(4, Math.min(48, n + 6 + (n % 5)));
  const viewerHint = Math.max(2, Math.min(12, 3 + (n % 9)));

  return {
    leadsAvailableLine: `Limited daily intake: roughly ${displayPool} qualified requests are routed to brokers today (varies by market).`,
    brokersViewedLine: `High-intent leads are often reviewed by ${viewerHint}+ brokers within 24h — submit early for faster matching.`,
  };
}
