import { detectSentimentFromTexts } from "@/modules/messaging/analysis/sentiment.detector";
import {
  computeEngagementScore,
  estimateDealProbability,
  type EngagementFeatures,
} from "@/modules/messaging/analysis/deal-predictor";
import { logInfo } from "@/lib/logger";

const TAG = "[conversation-analysis]";

export type ConversationAnalysisMessage = {
  body: string;
  senderId: string;
  createdAt: string;
};

export type ConversationAnalysisResult = {
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  engagementScore: number;
  dealProbability: number;
  insights: string[];
};

function intervalsBetweenParticipants(
  messages: ConversationAnalysisMessage[],
  viewerId: string,
  counterpartyId: string
): number[] {
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
  return gaps;
}

export function analyzeConversation(params: {
  messages: ConversationAnalysisMessage[];
  viewerId: string;
  counterpartyId: string;
}): ConversationAnalysisResult {
  const texts = params.messages.map((m) => m.body).filter(Boolean);
  const { sentiment, signals } = detectSentimentFromTexts(texts);

  const gaps = intervalsBetweenParticipants(params.messages, params.viewerId, params.counterpartyId);
  const avgResponseMinutes =
    gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null;

  const times = params.messages.map((m) => new Date(m.createdAt).getTime()).sort((a, b) => a - b);
  const spanMs = times.length >= 2 ? times[times.length - 1]! - times[0]! : 0;
  const spanDays = Math.max(1 / 24, spanMs / (86_400_000));
  const messagesPerDay = params.messages.length / spanDays;

  const engagementFeatures: EngagementFeatures = {
    avgResponseMinutes,
    messagesPerDay,
    totalMessages: params.messages.length,
  };
  const engagementScore = computeEngagementScore(engagementFeatures);
  const dealProbability = estimateDealProbability({ sentiment, engagementScore, signals });

  const insights: string[] = [];
  if (signals.interest && signals.hesitation) {
    insights.push("Client is interested but hesitant — address price or timing directly.");
  } else if (signals.interest) {
    insights.push("Strong buying signals — suggest a focused visit or offer checklist.");
  }
  if (avgResponseMinutes != null && avgResponseMinutes > 24 * 60) {
    insights.push("Slow reply cadence — a short follow-up within 12h may re-engage.");
  } else if (avgResponseMinutes != null && avgResponseMinutes <= 120) {
    insights.push("Fast back-and-forth — good momentum to propose next concrete step.");
  }
  if (signals.objections) {
    insights.push("Objections surfaced — clarify inclusions, comparables, or financing path.");
  }
  if (insights.length === 0) {
    insights.push("Maintain steady, value-add touchpoints until a visit or offer milestone is set.");
  }

  logInfo(`${TAG} summary`, {
    sentiment,
    engagementScore,
    dealProbability,
    n: params.messages.length,
  });

  return {
    sentiment,
    engagementScore,
    dealProbability,
    insights: insights.slice(0, 5),
  };
}
