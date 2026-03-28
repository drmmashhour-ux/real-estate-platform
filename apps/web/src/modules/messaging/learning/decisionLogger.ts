import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type LogConversationDecisionArgs = {
  conversationId: string;
  messageId?: string | null;
  stage: string | null | undefined;
  detectedIntent: string | null | undefined;
  detectedObjection: string | null | undefined;
  highIntent: boolean;
  selectedTemplateKey: string;
  reasonJson: Record<string, unknown>;
  wasExperiment: boolean;
  experimentKey?: string | null;
  outcomeAtSelection?: string | null;
};

export async function logConversationDecision(args: LogConversationDecisionArgs): Promise<{ id: string }> {
  const row = await prisma.growthAiConversationDecision.create({
    data: {
      id: randomUUID(),
      conversationId: args.conversationId,
      messageId: args.messageId ?? null,
      stage: args.stage ?? null,
      detectedIntent: args.detectedIntent ?? null,
      detectedObjection: args.detectedObjection ?? null,
      highIntent: args.highIntent,
      selectedTemplateKey: args.selectedTemplateKey,
      reasonJson: args.reasonJson as Prisma.InputJsonValue,
      wasExperiment: args.wasExperiment,
      experimentKey: args.experimentKey ?? null,
      outcomeAtSelection: args.outcomeAtSelection ?? null,
    },
    select: { id: true },
  });
  return { id: row.id };
}

export async function attachDecisionToAiMessage(decisionId: string, messageId: string): Promise<void> {
  await prisma.growthAiConversationDecision.updateMany({
    where: { id: decisionId, messageId: null },
    data: { messageId },
  });
}
