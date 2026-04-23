import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

export async function createFullAutopilotExecutionRow(params: {
  domain: string;
  actionType: string;
  sourceSystem: string;
  policyRuleId: string;
  decisionOutcome: string;
  riskLevel: string;
  confidence: number;
  explanation: string;
  explanationDetail?: Prisma.InputJsonValue;
  candidatePayload?: Prisma.InputJsonValue;
  executedPayload?: Prisma.InputJsonValue;
  platformActionId?: string | null;
  rollbackEligible?: boolean;
  actorUserId?: string | null;
  actorType?: string;
}) {
  return prisma.lecipmFullAutopilotExecution.create({
    data: {
      domain: params.domain,
      actionType: params.actionType,
      sourceSystem: params.sourceSystem,
      policyRuleId: params.policyRuleId,
      decisionOutcome: params.decisionOutcome,
      riskLevel: params.riskLevel,
      confidence: params.confidence,
      explanation: params.explanation,
      explanationDetail: params.explanationDetail,
      candidatePayload: params.candidatePayload,
      executedPayload: params.executedPayload,
      platformActionId: params.platformActionId ?? undefined,
      rollbackEligible: params.rollbackEligible ?? false,
      actorUserId: params.actorUserId ?? undefined,
      actorType: params.actorType ?? "system",
    },
  });
}

export async function linkExecutionToPlatformAction(executionId: string, platformActionId: string) {
  return prisma.lecipmFullAutopilotExecution.update({
    where: { id: executionId },
    data: { platformActionId },
  });
}
