import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function logGrowthAiOrchestrationAction(params: {
  orchestrationId: string;
  conversationId: string;
  actionType: string;
  resultStatus: string;
  actionPayload?: Prisma.InputJsonValue;
}): Promise<void> {
  await prisma.growthAiActionLog.create({
    data: {
      orchestrationId: params.orchestrationId,
      conversationId: params.conversationId,
      actionType: params.actionType,
      resultStatus: params.resultStatus,
      actionPayload: params.actionPayload ?? undefined,
    },
  });
}
