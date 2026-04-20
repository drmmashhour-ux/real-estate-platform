import { prisma } from "@/lib/db";

export async function getLatestCapitalPlanSummary(scopeType: string, scopeId: string) {
  const plan = await prisma.capitalAllocationPlan.findFirst({
    where: {
      scopeType,
      scopeId,
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  if (!plan) return null;

  const byType: Record<string, number> = {};

  for (const item of plan.items) {
    byType[item.allocationType] = Number(byType[item.allocationType] || 0) + Number(item.allocatedAmount || 0);
  }

  return {
    planId: plan.id,
    status: plan.status,
    totalBudget: plan.totalBudget,
    allocatableBudget: plan.allocatableBudget,
    reserveBudget: plan.reserveBudget,
    byType,
    topItems: [...plan.items]
      .sort((a, b) => Number(b.allocatedAmount) - Number(a.allocatedAmount))
      .slice(0, 10),
  };
}
