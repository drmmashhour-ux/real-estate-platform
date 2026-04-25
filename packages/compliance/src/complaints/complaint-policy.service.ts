import { prisma } from "@/lib/db";

export async function hasWrittenComplaintPolicy(ownerType: string, ownerId: string): Promise<boolean> {
  const row = await prisma.complaintWrittenPolicyRecord.findUnique({
    where: { ownerType_ownerId: { ownerType, ownerId } },
    select: { id: true, policySummary: true },
  });
  return Boolean(row && row.policySummary.trim().length > 0);
}

export async function upsertWrittenComplaintPolicy(input: {
  ownerType: string;
  ownerId: string;
  policySummary: string;
  documentUrl?: string | null;
  versionLabel?: string | null;
  effectiveAt?: Date;
}): Promise<void> {
  const effectiveAt = input.effectiveAt ?? new Date();
  await prisma.complaintWrittenPolicyRecord.upsert({
    where: { ownerType_ownerId: { ownerType: input.ownerType, ownerId: input.ownerId } },
    create: {
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      policySummary: input.policySummary,
      documentUrl: input.documentUrl ?? null,
      versionLabel: input.versionLabel ?? null,
      effectiveAt,
    },
    update: {
      policySummary: input.policySummary,
      documentUrl: input.documentUrl ?? undefined,
      versionLabel: input.versionLabel ?? undefined,
      effectiveAt,
    },
  });
}
