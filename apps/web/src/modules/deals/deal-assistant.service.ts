import { marketplaceAiV5Flags } from "@/config/feature-flags";
import {
  analyzeConversation,
  type ConversationMessageInput,
  type DealAssistantAnalysis,
} from "@/src/modules/deal-assistant/dealAssistantEngine";
import { prisma } from "@/lib/db";

export type DealAssistantV5Result = DealAssistantAnalysis & {
  explainability: {
    reasoning: string[];
    dataUsed: string[];
    requiresHumanApproval: boolean;
  };
};

/**
 * v5 wrapper — same heuristic engine, adds audit + explicit approval gates.
 */
export async function runDealAssistantV5(
  messages: ConversationMessageInput[],
  audit?: { dealId?: string; operatorUserId?: string },
): Promise<DealAssistantV5Result | null> {
  if (!marketplaceAiV5Flags.dealAssistantV1) return null;

  const analysis = analyzeConversation(messages);
  const reasoning = [
    "Keyword/heuristic intent + objection detection (no external LLM).",
    `Recommended operator action: ${analysis.recommendedAction}`,
  ];
  const dataUsed = [`message_count:${messages.length}`, ...(audit?.dealId ? [`deal:${audit.dealId}`] : [])];

  await prisma.marketplaceAgentV5DecisionLog.create({
    data: {
      agentKind: "broker",
      subjectType: audit?.dealId ? "deal" : undefined,
      subjectId: audit?.dealId,
      decisionType: "deal_assistant_v1",
      inputJson: { messageCount: messages.length } as object,
      outputJson: analysis as unknown as object,
      reasoning: reasoning.join("\n"),
      confidence: analysis.confidence,
      dataUsedSummary: dataUsed.join("; "),
      requiresApproval: true,
    },
  });

  return {
    ...analysis,
    explainability: {
      reasoning,
      dataUsed,
      requiresHumanApproval: true,
    },
  };
}
