import { prisma } from "@/lib/db";

export async function createOptimizationAuditLog(input: {
  listingId: string;
  suggestionId?: string | null;
  action: string;
  oldValue?: string | null;
  newValue?: string | null;
  performedByUserId?: string | null;
}): Promise<void> {
  await prisma.listingOptimizationAudit.create({
    data: {
      listingId: input.listingId,
      suggestionId: input.suggestionId ?? undefined,
      action: input.action,
      oldValue: input.oldValue ?? undefined,
      newValue: input.newValue ?? undefined,
      performedByUserId: input.performedByUserId ?? undefined,
    },
  });
}
