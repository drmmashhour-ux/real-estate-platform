import { prisma } from "@/lib/db";

export type PipelineSummaryPayload = {
  totalDeals: number;
  byStage: Record<string, number>;
  byDecisionStatus: Record<string, number>;
  criticalConditionsOpen: number;
  blockedDiligenceCount: number;
  upcomingCommitteeCount: number;
  dealsNeedingAttention: Array<{ id: string; title: string; pipelineStage: string; reason: string }>;
  recentlyApproved: Array<{ id: string; title: string; updatedAt: string }>;
  recentlyDeclined: Array<{ id: string; title: string; updatedAt: string }>;
};

function scopeWhere(userId: string, role: string | undefined) {
  if (role === "ADMIN") return {};
  return {
    OR: [
      { ownerUserId: userId },
      { sponsorUserId: userId },
      { listing: { ownerId: userId } },
      { listing: { brokerAccesses: { some: { brokerId: userId } } } },
    ],
  };
}

export async function getPipelineSummaryForViewer(userId: string, role: string | undefined): Promise<PipelineSummaryPayload> {
  const base = scopeWhere(userId, role);

  const deals = await prisma.investmentPipelineDeal.findMany({
    where: base,
    select: {
      id: true,
      title: true,
      pipelineStage: true,
      decisionStatus: true,
      status: true,
      updatedAt: true,
    },
  });

  const ids = deals.map((d) => d.id);
  if (ids.length === 0) {
    return {
      totalDeals: 0,
      byStage: {},
      byDecisionStatus: {},
      criticalConditionsOpen: 0,
      blockedDiligenceCount: 0,
      upcomingCommitteeCount: 0,
      dealsNeedingAttention: [],
      recentlyApproved: [],
      recentlyDeclined: [],
    };
  }

  const criticalConditionsOpen = await prisma.investmentPipelineCondition.count({
    where: {
      dealId: { in: ids },
      priority: "CRITICAL",
      status: { in: ["OPEN", "IN_PROGRESS"] },
    },
  });

  const blockedDiligenceCount = await prisma.investmentPipelineDiligenceTask.count({
    where: {
      dealId: { in: ids },
      status: "BLOCKED",
    },
  });

  const upcomingCommitteeCount = await prisma.investmentPipelineDeal.count({
    where: {
      id: { in: ids },
      pipelineStage: { in: ["IC_PREP", "IC_REVIEW"] },
      decisionStatus: "PENDING",
    },
  });

  const byStage: Record<string, number> = {};
  const byDecisionStatus: Record<string, number> = {};
  for (const d of deals) {
    byStage[d.pipelineStage] = (byStage[d.pipelineStage] ?? 0) + 1;
    const ds = d.decisionStatus ?? "UNKNOWN";
    byDecisionStatus[ds] = (byDecisionStatus[ds] ?? 0) + 1;
  }

  const dealsNeedingAttention: PipelineSummaryPayload["dealsNeedingAttention"] = [];
  for (const d of deals) {
    if (d.pipelineStage === "ON_HOLD" || d.status === "ON_HOLD") {
      dealsNeedingAttention.push({
        id: d.id,
        title: d.title,
        pipelineStage: d.pipelineStage,
        reason: "On hold — awaiting inputs",
      });
    }
  }

  const recent = await prisma.investmentPipelineDeal.findMany({
    where: { id: { in: ids }, status: "APPROVED" },
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: { id: true, title: true, updatedAt: true },
  });

  const declined = await prisma.investmentPipelineDeal.findMany({
    where: { id: { in: ids }, status: "DECLINED" },
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: { id: true, title: true, updatedAt: true },
  });

  return {
    totalDeals: deals.length,
    byStage,
    byDecisionStatus,
    criticalConditionsOpen,
    blockedDiligenceCount,
    upcomingCommitteeCount,
    dealsNeedingAttention: dealsNeedingAttention.slice(0, 20),
    recentlyApproved: recent.map((r) => ({
      id: r.id,
      title: r.title,
      updatedAt: r.updatedAt.toISOString(),
    })),
    recentlyDeclined: declined.map((r) => ({
      id: r.id,
      title: r.title,
      updatedAt: r.updatedAt.toISOString(),
    })),
  };
}
