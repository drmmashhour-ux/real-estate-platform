import type { LecipmFormInstanceStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { appendFormVersion } from "./form-versioning.service";

export async function createFormInstance(input: {
  templateId: string;
  dealId: string;
  createdByUserId?: string | null;
  initialData?: Record<string, unknown>;
  status?: LecipmFormInstanceStatus;
}) {
  return prisma.lecipmFormInstance.create({
    data: {
      templateId: input.templateId,
      dealId: input.dealId,
      createdByUserId: input.createdByUserId ?? undefined,
      data: (input.initialData ?? {}) as Prisma.InputJsonValue,
      status: input.status ?? "draft",
    },
  });
}

export async function updateFormInstanceData(input: {
  id: string;
  data: Record<string, unknown>;
  status?: LecipmFormInstanceStatus;
  userId?: string;
}) {
  const existing = await prisma.lecipmFormInstance.findUnique({ where: { id: input.id } });
  if (!existing) throw new Error("Form instance not found");

  const nextVersion = existing.version + 1;
  await appendFormVersion({ formInstanceId: existing.id, version: existing.version, data: existing.data as object });

  return prisma.lecipmFormInstance.update({
    where: { id: input.id },
    data: {
      data: input.data as Prisma.InputJsonValue,
      version: nextVersion,
      status: input.status ?? existing.status,
    },
  });
}

export async function listInstancesForDeal(dealId: string) {
  return prisma.lecipmFormInstance.findMany({
    where: { dealId },
    include: { template: true },
    orderBy: { updatedAt: "desc" },
  });
}
