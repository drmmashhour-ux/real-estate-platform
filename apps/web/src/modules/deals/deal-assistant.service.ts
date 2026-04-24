import { intelligenceFlags, marketplaceAiV5Flags } from "@/config/feature-flags";
import { logMemoryAudit } from "@/lib/marketplace-memory/memory-audit";
import {
  analyzeConversation,
  type ConversationMessageInput,
  type DealAssistantAnalysis,
  type DealAssistantMemoryHints,
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
  audit?: { dealId?: string; operatorUserId?: string; counterpartyUserId?: string },
): Promise<DealAssistantV5Result | null> {
  if (!marketplaceAiV5Flags.dealAssistantV1) return null;

  let marketplaceMemoryHints: DealAssistantMemoryHints | undefined;
  if (audit?.counterpartyUserId && intelligenceFlags.marketplaceMemoryEngineV1) {
    const profile = await prisma.userMemoryProfile.findUnique({
      where: { userId: audit.counterpartyUserId },
      select: { personalizationEnabled: true, intentSummaryJson: true, behaviorSummaryJson: true },
    });
    if (profile?.personalizationEnabled) {
      marketplaceMemoryHints = {
        urgencyScore: (profile.intentSummaryJson as { urgencyScore?: number })?.urgencyScore,
        activeVsPassive: (profile.behaviorSummaryJson as { activeVsPassive?: string })?.activeVsPassive,
      };
      void logMemoryAudit({
        userId: audit.counterpartyUserId,
        actionType: "memory_read",
        summary: "Memory read for negotiation / deal assistant context",
        actorId: audit.operatorUserId ?? audit.counterpartyUserId,
        details: { dealId: audit.dealId ?? null },
      }).catch(() => null);
    }
  }

  const analysis = analyzeConversation(messages, { marketplaceMemoryHints });
  const reasoning = [
    "Keyword/heuristic intent + objection detection (no external LLM).",
    `Recommended operator action: ${analysis.recommendedAction}`,
    ...(marketplaceMemoryHints ? ["Marketplace memory hints applied as a light urgency assist (bounded)."] : []),
  ];
  const dataUsed = [
    `message_count:${messages.length}`,
    ...(audit?.dealId ? [`deal:${audit.dealId}`] : []),
    ...(marketplaceMemoryHints ? ["marketplace_memory:counterparty"] : []),
  ];

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
