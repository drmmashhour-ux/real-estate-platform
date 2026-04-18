import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { ContractWorkflowState } from "./deal-transaction.service";
import { logDealExecutionEvent } from "@/lib/deals/execution-events";

export async function transitionDealWorkflowState(input: {
  dealId: string;
  fromState: ContractWorkflowState | null;
  toState: ContractWorkflowState;
  actorUserId: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.$transaction([
    prisma.deal.update({
      where: { id: input.dealId },
      data: { contractWorkflowState: input.toState },
    }),
    prisma.dealStateTransition.create({
      data: {
        dealId: input.dealId,
        fromState: input.fromState ?? "intake",
        toState: input.toState,
        reason: input.reason ?? null,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
        createdById: input.actorUserId,
      },
    }),
  ]);

  void logDealExecutionEvent({
    eventType: "review_completed",
    userId: input.actorUserId,
    dealId: input.dealId,
    metadata: { workflowTransition: input.toState },
  });
}
