import { prisma } from "@/lib/db";

export async function approveCapitalPlan(planId: string) {
  const plan = await prisma.capitalAllocationPlan.update({
    where: { id: planId },
    data: { status: "approved" },
  });

  await prisma.capitalAllocationLog.create({
    data: {
      planId,
      eventType: "approved",
      message: "Capital allocation plan approved (no funds moved — informational status).",
    },
  });

  return plan;
}

export async function applyCapitalPlan(planId: string) {
  const plan = await prisma.capitalAllocationPlan.findUnique({
    where: { id: planId },
    include: { items: true },
  });

  if (!plan) throw new Error("Plan not found");
  if (plan.status !== "approved") throw new Error("Plan must be approved before apply");

  for (const item of plan.items) {
    await prisma.capitalAllocationItem.update({
      where: { id: item.id },
      data: { status: "applied" },
    });
  }

  const updated = await prisma.capitalAllocationPlan.update({
    where: { id: planId },
    data: { status: "applied" },
  });

  await prisma.capitalAllocationLog.create({
    data: {
      planId,
      eventType: "applied",
      message:
        "Capital allocation plan marked applied — bookkeeping only until payment integration; does not move money.",
      meta: { itemCount: plan.items.length },
    },
  });

  return updated;
}
