import type { DealExecutionType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logDealExecutionEvent } from "@/lib/deals/execution-events";

export async function updateDealExecutionProfile(input: {
  dealId: string;
  actorUserId: string;
  dealExecutionType?: DealExecutionType | null;
  assignedFormPackageKey?: string | null;
  jurisdiction?: string | null;
  propertyReferenceId?: string | null;
  executionMetadata?: Record<string, unknown>;
}): Promise<void> {
  const data: Prisma.DealUpdateInput = {};
  if (input.dealExecutionType !== undefined) data.dealExecutionType = input.dealExecutionType;
  if (input.assignedFormPackageKey !== undefined) data.assignedFormPackageKey = input.assignedFormPackageKey;
  if (input.jurisdiction !== undefined) data.jurisdiction = input.jurisdiction;
  if (input.propertyReferenceId !== undefined) data.propertyReferenceId = input.propertyReferenceId;
  if (input.executionMetadata !== undefined) data.executionMetadata = input.executionMetadata as Prisma.InputJsonValue;

  await prisma.deal.update({
    where: { id: input.dealId },
    data,
  });

  await prisma.dealExecutionAuditLog.create({
    data: {
      dealId: input.dealId,
      actorUserId: input.actorUserId,
      actionKey: "deal_execution_profile_updated",
      payload: data as Prisma.InputJsonValue,
    },
  });

  if (input.assignedFormPackageKey !== undefined) {
    await logDealExecutionEvent({
      eventType: "form_package_selected",
      userId: input.actorUserId,
      dealId: input.dealId,
      metadata: { assignedFormPackageKey: input.assignedFormPackageKey },
    });
  }
}
