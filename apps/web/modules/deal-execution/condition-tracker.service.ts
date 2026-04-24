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
    const status = input.status ?? "pending";
    const now = new Date();
    return prisma.dealClosingCondition.update({
      where: { id: input.id },
      data: {
        conditionType: input.conditionType,
        deadline: input.deadline,
        status,
        relatedForm: input.relatedForm,
        notes: input.notes,
        fulfilledAt: status === "fulfilled" ? now : null,
        waivedAt: status === "waived" ? now : null,
        failedAt: status === "failed" ? now : null,
      },
    });
  }
  const status = input.status ?? "pending";
  const now = new Date();
  return prisma.dealClosingCondition.create({
    data: {
      dealId: input.dealId,
      conditionType: input.conditionType,
      deadline: input.deadline,
      status,
      relatedForm: input.relatedForm,
      notes: input.notes,
      fulfilledAt: status === "fulfilled" ? now : null,
      waivedAt: status === "waived" ? now : null,
      failedAt: status === "failed" ? now : null,
    },
  });
}

export async function countOpenConditions(dealId: string): Promise<number> {
  return prisma.dealClosingCondition.count({
    where: { dealId, status: { notIn: ["fulfilled", "waived"] } },
  });
}
