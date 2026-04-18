import { prisma } from "@/lib/db";

export async function listConditions(dealId: string) {
  return prisma.dealClosingCondition.findMany({
    where: { dealId },
    orderBy: { deadline: "asc" },
  });
}

export async function upsertCondition(input: {
  dealId: string;
  id?: string;
  conditionType: string;
  deadline?: Date | null;
  status?: string;
  relatedForm?: string | null;
  notes?: string | null;
}) {
  if (input.id) {
    return prisma.dealClosingCondition.update({
      where: { id: input.id },
      data: {
        conditionType: input.conditionType,
        deadline: input.deadline,
        status: input.status,
        relatedForm: input.relatedForm,
        notes: input.notes,
        fulfilledAt: input.status === "fulfilled" ? new Date() : null,
      },
    });
  }
  return prisma.dealClosingCondition.create({
    data: {
      dealId: input.dealId,
      conditionType: input.conditionType,
      deadline: input.deadline,
      status: input.status ?? "pending",
      relatedForm: input.relatedForm,
      notes: input.notes,
    },
  });
}

export async function countOpenConditions(dealId: string): Promise<number> {
  return prisma.dealClosingCondition.count({
    where: { dealId, status: { not: "fulfilled" } },
  });
}
