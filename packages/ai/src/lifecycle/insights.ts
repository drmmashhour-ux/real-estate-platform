import { prisma } from "@/lib/db";

export type LifecycleInsights = {
  leadCounts: { total: number; hot: number; warm: number; cold: number; unknown: number };
  leadsBySource: Record<string, number>;
  dealCounts: { active: number; closed: number };
  dealsByCrmStage: Record<string, number>;
  retentionDueSoon: number;
  disclaimer: string;
};

function tierBucket(aiTier: string | null, score: number): "hot" | "warm" | "cold" | "unknown" {
  const t = (aiTier ?? "").toLowerCase();
  if (t === "hot" || t === "warm" || t === "cold") return t;
  if (score >= 80) return "hot";
  if (score >= 50) return "warm";
  if (score > 0) return "cold";
  return "unknown";
}

/** Aggregate counts for broker dashboard — no fake conversion % without outcome data. */
export async function computeBrokerLifecycleInsights(
  brokerId: string,
  options?: { adminView?: boolean }
): Promise<LifecycleInsights> {
  const leadWhere = options?.adminView
    ? {}
    : {
        OR: [{ introducedByBrokerId: brokerId }, { lastFollowUpByBrokerId: brokerId }],
      };

  const leads = await prisma.lead.findMany({
    where: leadWhere,
    select: { score: true, aiTier: true, leadSource: true, status: true },
    take: 500,
  });

  let hot = 0,
    warm = 0,
    cold = 0,
    unknown = 0;
  const bySource: Record<string, number> = {};
  for (const l of leads) {
    const b = tierBucket(l.aiTier, l.score);
    if (b === "hot") hot++;
    else if (b === "warm") warm++;
    else if (b === "cold") cold++;
    else unknown++;
    const src = l.leadSource || "unknown";
    bySource[src] = (bySource[src] ?? 0) + 1;
  }

  const deals = await prisma.deal.findMany({
    where: options?.adminView ? {} : { brokerId },
    select: { status: true, crmStage: true },
    take: 200,
  });

  let active = 0,
    closed = 0;
  const byStage: Record<string, number> = {};
  for (const d of deals) {
    if (d.status === "closed") closed++;
    else if (d.status !== "cancelled") active++;
    const stage = d.crmStage || "unset";
    byStage[stage] = (byStage[stage] ?? 0) + 1;
  }

  const soon = new Date();
  soon.setDate(soon.getDate() + 14);
  const retentionDueSoon = await prisma.clientRetentionTouchpoint.count({
    where: {
      ...(options?.adminView ? {} : { brokerId }),
      status: "pending",
      scheduledFor: { lte: soon },
    },
  });

  return {
    leadCounts: { total: leads.length, hot, warm, cold, unknown },
    leadsBySource: bySource,
    dealCounts: { active, closed },
    dealsByCrmStage: byStage,
    retentionDueSoon,
    disclaimer:
      "Counts are descriptive only — not predictive. Conversion rates need outcome labels you maintain in CRM.",
  };
}
