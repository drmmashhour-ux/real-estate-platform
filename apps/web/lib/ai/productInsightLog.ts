import "server-only";

import { getLegacyDB } from "@/lib/db/legacy";

/** Matches `ProductInsight` shape — kept local to avoid import cycles with productIntelligence. */
export type InsightLogSnapshotInput = {
  type: "retention" | "feedback" | "revenue";
  summary: string;
  metric: number;
};

const prisma = getLegacyDB();

export type InsightPriority = "low" | "medium" | "high";

/**
 * Heuristic priority for stored rows — aligns loosely with Order 57 thresholds in productIntelligence.
 */
export function deriveInsightPriority(ins: InsightLogSnapshotInput): InsightPriority {
  const { type, metric, summary } = ins;
  const s = summary.toLowerCase();

  if (type === "retention") {
    if (metric >= 20) return "high";
    if (metric >= 5) return "medium";
    return "low";
  }

  if (type === "feedback") {
    if (/\d+\s+mention\(s\)/.test(summary) && metric >= 3) return "high";
    if (/bug|error|broken|slow|confus/i.test(s)) return metric >= 2 ? "medium" : "low";
    if (metric >= 10) return "medium";
    return "low";
  }

  // revenue
  if (s.includes("low monetization") || s.includes("few revenue")) return "medium";
  return "low";
}

/** Persist one row per insight line — snapshot of each `getProductInsights` run. */
export async function persistProductInsightLogs(insights: InsightLogSnapshotInput[]): Promise<void> {
  if (insights.length === 0) return;

  await prisma.productInsightLog.createMany({
    data: insights.map((ins) => ({
      type: ins.type,
      message: ins.summary,
      priority: deriveInsightPriority(ins),
    })),
  });
}

export async function getProductInsightHistory(opts?: { limit?: number }): Promise<
  { id: string; type: string; message: string; priority: string; createdAt: Date }[]
> {
  const limit = Math.min(Math.max(opts?.limit ?? 200, 1), 1000);
  return prisma.productInsightLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      type: true,
      message: true,
      priority: true,
      createdAt: true,
    },
  });
}
