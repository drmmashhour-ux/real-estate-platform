import { prisma } from "@/lib/db";

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export async function rebalanceCapitalPlan(planId: string, additionalBudget: number) {
  const plan = await prisma.capitalAllocationPlan.findUnique({
    where: { id: planId },
    include: { items: true },
  });

  if (!plan) throw new Error("Plan not found");
  if (additionalBudget <= 0) throw new Error("additionalBudget must be positive");

  const eligible = plan.items.filter((item) => item.status !== "rejected");
  const totalPriority = eligible.reduce((sum, item) => sum + Number(item.priorityScore || 0), 0);

  for (const item of eligible) {
    const extra =
      totalPriority > 0 ? round2((additionalBudget * Number(item.priorityScore || 0)) / totalPriority) : 0;

    await prisma.capitalAllocationItem.update({
      where: { id: item.id },
      data: {
        allocatedAmount: round2(Number(item.allocatedAmount || 0) + extra),
      },
    });
  }

  const updated = await prisma.capitalAllocationPlan.update({
    where: { id: planId },
    data: {
      totalBudget: round2(Number(plan.totalBudget || 0) + additionalBudget),
      allocatableBudget: round2(Number(plan.allocatableBudget || 0) + additionalBudget),
    },
  });

  await prisma.capitalAllocationLog.create({
    data: {
      planId,
      eventType: "rebalanced",
      message: "Capital plan rebalanced with additional budget (record update only).",
      meta: { additionalBudget },
    },
  });

  return updated;
}
