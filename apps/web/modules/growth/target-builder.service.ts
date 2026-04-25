/**
 * Manual-first target list: brokers are added via the outreach hub (Instagram / LinkedIn / referral / maps).
 * No automated scraping — this module only queries and orders `OutreachLead` rows.
 */

import { prisma } from "@/lib/db";
import { scoreOutreachLeadRow } from "./target-scoring.service";

export type BuildTargetListOptions = {
  /** Max rows (default 200). */
  limit?: number;
  /** Minimum stored `score` (default 0). */
  minScore?: number;
  /** Exclude LOST (default true). */
  excludeLost?: boolean;
};

/**
 * Prioritized target list for operator review — ordered by `targetScore` (stored on `OutreachLead.score`).
 */
export async function buildTargetList(options?: BuildTargetListOptions) {
  const take = options?.limit ?? 200;
  const minScore = options?.minScore ?? 0;
  const where: {
    score: { gte: number };
    status?: { not: string };
  } = { score: { gte: minScore } };
  if (options?.excludeLost !== false) {
    where.status = { not: "LOST" };
  }

  return prisma.outreachLead.findMany({
    where,
    orderBy: [{ score: "desc" }, { createdAt: "desc" }],
    take,
  });
}

/**
 * Top N brokers to focus on today — in-play pipeline, highest fresh score first.
 * Re-scores rows in memory for consistency with the latest `scoreBrokerTarget` rules.
 */
export async function getDailyTargets(limit = 5) {
  const rows = await prisma.outreachLead.findMany({
    where: {
      status: { in: ["NEW", "CONTACTED", "RESPONDED", "INTERESTED"] },
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 150,
  });

  const enriched = rows.map((r) => ({
    ...r,
    score: scoreOutreachLeadRow(r),
  }));
  enriched.sort((a, b) => b.score - a.score);
  return enriched.slice(0, limit);
}
