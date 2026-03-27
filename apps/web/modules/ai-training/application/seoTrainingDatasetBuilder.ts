import type { PrismaClient } from "@prisma/client";

export async function buildSeoTrainingDataset(db: PrismaClient, days = 90) {
  const since = new Date(Date.now() - Math.max(1, days) * 24 * 60 * 60 * 1000);
  const rows = await db.trafficEvent.findMany({
    where: {
      createdAt: { gte: since },
      OR: [{ path: { startsWith: "/analysis/" } }, { path: { startsWith: "/market/" } }, { path: { startsWith: "/blog/" } }],
      eventType: { in: ["page_view", "signup_completed", "analysis_event"] },
    },
    select: { path: true, eventType: true, source: true, campaign: true, createdAt: true },
  });

  const byPath = new Map<string, { views: number; signups: number; analyses: number }>();
  for (const r of rows) {
    const path = r.path ?? "/";
    const cur = byPath.get(path) ?? { views: 0, signups: 0, analyses: 0 };
    if (r.eventType === "page_view") cur.views += 1;
    if (r.eventType === "signup_completed") cur.signups += 1;
    if (r.eventType === "analysis_event") cur.analyses += 1;
    byPath.set(path, cur);
  }

  return [...byPath.entries()].map(([path, v]) => ({
    path,
    views: v.views,
    signups: v.signups,
    analyses: v.analyses,
    signupRate: v.views ? v.signups / v.views : 0,
    analysisRate: v.views ? v.analyses / v.views : 0,
  }));
}
