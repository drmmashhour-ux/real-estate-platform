import type { PrismaClient } from "@prisma/client";

export async function learnLeadOutcomeAdjustments(db: PrismaClient, days = 60) {
  const since = new Date(Date.now() - Math.max(1, days) * 24 * 60 * 60 * 1000);
  const leads = await db.lead.findMany({
    where: { createdAt: { gte: since } },
    select: {
      source: true,
      lecipmLeadScore: true,
      lecipmDealQualityScore: true,
      lecipmTrustScore: true,
      engagementScore: true,
      highIntent: true,
      wonAt: true,
    },
  });
  const bySource = new Map<string, { total: number; won: number }>();
  for (const l of leads) {
    const k = (l.source ?? "unknown").toLowerCase();
    const cur = bySource.get(k) ?? { total: 0, won: 0 };
    cur.total += 1;
    if (l.wonAt) cur.won += 1;
    bySource.set(k, cur);
  }
  const sourceMultipliers = [...bySource.entries()].map(([source, v]) => ({
    source,
    winRate: v.total ? v.won / v.total : 0,
    suggestedMultiplier: v.total ? Math.max(0.8, Math.min(1.25, 0.9 + (v.won / v.total) * 0.5)) : 1,
  }));
  return {
    days,
    sampleSize: leads.length,
    sourceMultipliers,
  };
}
