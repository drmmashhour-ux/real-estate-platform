import { analyzeConversation, type ConversationAnalysisMessage } from "@/modules/messaging/analysis/conversation-analysis.engine";
import { classifyObjections, type ClassifierMessage } from "@/modules/messaging/analysis/objection-classifier";
import { classifyDealStage, type StageMessage } from "@/modules/messaging/analysis/deal-stage-classifier";
import { buildConversationRiskHeatmap, type RiskGapHints } from "@/modules/messaging/analysis/risk-heatmap.service";
import { computeClosingReadiness } from "@/modules/messaging/analysis/closing-readiness.service";
import { generateBrokerCoaching, type BrokerCoaching } from "@/modules/messaging/assistant/broker-coaching.service";
import type { AssistantConversationShape, MemorySnapshotShape } from "@/modules/messaging/assistant/next-action.service";

function gapsFromMessages(
  messages: ConversationAnalysisMessage[],
  viewerId: string,
  counterpartyId: string
): { avgResponseMinutes: number | null; lastGapHours: number | null } {
  const gaps: number[] = [];
  let lastIncoming: Date | null = null;
  const sorted = [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  for (const m of sorted) {
    const t = new Date(m.createdAt);
    if (m.senderId === counterpartyId) {
      lastIncoming = t;
    } else if (m.senderId === viewerId && lastIncoming) {
      gaps.push((t.getTime() - lastIncoming.getTime()) / 60_000);
      lastIncoming = null;
    }
  }
  const avgResponseMinutes = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null;
  const last = sorted[sorted.length - 1];
  const lastGapHours = last
    ? (Date.now() - new Date(last.createdAt).getTime()) / 3_600_000
    : null;
  return { avgResponseMinutes, lastGapHours };
}

export type ConversationAiEngineResult = {
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  dealPrediction: { dealProbability: number; engagementScore: number };
  conversationInsights: string[];
  objections: ReturnType<typeof classifyObjections>;
  dealStage: ReturnType<typeof classifyDealStage>;
  riskHeatmap: ReturnType<typeof buildConversationRiskHeatmap>;
  closingReadiness: ReturnType<typeof computeClosingReadiness>;
  coaching: BrokerCoaching;
};

/**
 * Single entry for broker-side conversation AI. Heuristic, explainable, not financial or legal advice.
 */
export function runConversationAiEngine(params: {
  conversation: AssistantConversationShape;
  memory: MemorySnapshotShape;
  messages: ConversationAnalysisMessage[];
  viewerId: string;
  counterpartyId: string;
}): ConversationAiEngineResult {
  try {
    const { messages, viewerId, counterpartyId, memory, conversation } = params;
    const analysis = analyzeConversation({ messages, viewerId, counterpartyId });
    const gapResult = gapsFromMessages(messages, viewerId, counterpartyId);
    const dealPrediction = { dealProbability: analysis.dealProbability, engagementScore: analysis.engagementScore };

    const clMsgs: ClassifierMessage[] = messages.map((m) => ({
      body: m.body,
      senderId: m.senderId,
      counterpartyId,
    }));
    const objections = classifyObjections(clMsgs);

    const stMsgs: StageMessage[] = messages.map((m) => ({
      body: m.body,
      createdAt: m.createdAt,
      senderId: m.senderId,
      counterpartyId,
      viewerId,
    }));
    const dealStage = classifyDealStage(stMsgs, analysis, memory, objections);

    const riskGaps: RiskGapHints = { avgResponseMinutes: gapResult.avgResponseMinutes, lastGapHours: gapResult.lastGapHours };
    const riskHeatmap = buildConversationRiskHeatmap(conversation, analysis, objections, dealStage, riskGaps);

    const closingReadiness = computeClosingReadiness(conversation, dealStage, objections, analysis);

    const coaching = generateBrokerCoaching({
      conversation,
      insights: analysis,
      objections,
      dealStage,
      riskHeatmap,
      clientMemory: memory,
    });

    return {
      sentiment: analysis.sentiment,
      dealPrediction: { dealProbability: analysis.dealProbability, engagementScore: analysis.engagementScore },
      conversationInsights: analysis.insights,
      objections,
      dealStage,
      riskHeatmap,
      closingReadiness,
      coaching,
    };
  } catch (e) {
    return {
      sentiment: "NEUTRAL",
      dealPrediction: { dealProbability: 0, engagementScore: 0 },
      conversationInsights: [
        (e instanceof Error ? e.message : "limited") + " — fall back to manual review; nothing was sent automatically.",
      ],
      objections: { objections: [], dominantObjection: null },
      dealStage: { stage: "new" as const, confidence: 0, rationale: ["Engine fallback."] },
      riskHeatmap: {
        overallRisk: "low" as const,
        riskScore: 0,
        risks: [
          {
            key: "engine_error",
            label: "Engine fallback",
            level: "low" as const,
            rationale: ["A neutral placeholder — review the thread manually. Nothing was auto-sent or auto-decided for you here."],
          },
        ],
      },
      closingReadiness: { score: 0, label: "not_ready" as const, rationale: [] },
      coaching: { coaching: [], topCoachingPriority: null },
    };
  }
}
