import { runConversationAiEngine } from "@/modules/messaging/analysis/conversation-ai.engine";
import type { ConversationAnalysisMessage } from "@/modules/messaging/analysis/conversation-analysis.engine";
import { extractPreferencesFromTexts } from "@/modules/crm-memory/preference.extractor";
import type { CallSession, PostCallAnalysisResult, PostCallExtractedPreferences } from "@/modules/messaging/call/call.types";
import type { MemorySnapshotShape } from "@/modules/messaging/assistant/next-action.service";
import { callAiLog } from "@/modules/messaging/call/call-ai-logger";
import type { AssistantConversationShape } from "@/modules/messaging/assistant/next-action.service";

/**
 * Build synthetic message rows from a transcript (diarization not required).
 * Heuristic: double-newline blocks alternate client / broker, starting with client.
 */
export function buildMessagesFromTranscript(
  transcript: string,
  brokerId: string,
  clientId: string
): ConversationAnalysisMessage[] {
  const parts = transcript
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (parts.length === 0) return [];
  const base = Date.now();
  const out: ConversationAnalysisMessage[] = [];
  for (let i = 0; i < parts.length; i++) {
    const fromClient = i % 2 === 0;
    out.push({
      body: parts[i]!,
      senderId: fromClient ? clientId : brokerId,
      createdAt: new Date(base + i * 60_000).toISOString(),
    });
  }
  return out;
}

function buildExtracted(ex: ReturnType<typeof extractPreferencesFromTexts>, ai: ReturnType<typeof runConversationAiEngine>): PostCallExtractedPreferences {
  const financingSignals: string[] = [];
  if (ai.objections.objections.some((o) => o.type === "financing" && o.confidence >= 0.4)) {
    financingSignals.push("financing_concern_or_process_mentioned");
  }
  return {
    budgetLabel: ex.budgetLabel,
    preferredArea: ex.preferredArea,
    propertyType: ex.propertyType,
    financingSignals,
    urgencyHint:
      ai.closingReadiness.label === "near_closing" ? "high" : ai.closingReadiness.label === "not_ready" ? "low" : "medium",
  };
}

/**
 * Post-call review from optional transcript + CRM memory. Heuristics only — not legal or financial advice.
 * Safe when transcript is missing ( sparse fallback ).
 */
export function runPostCallAnalysis(
  call: CallSession,
  transcript: string | undefined,
  memory: MemorySnapshotShape
): PostCallAnalysisResult {
  try {
    const ended = call.endedAt ?? call.startedAt;
    const ac: AssistantConversationShape = {
      id: call.conversationId,
      type: "DIRECT",
      lastActivityAt: ended,
      lastMessageFromViewer: undefined,
    };

    const text = (transcript ?? "").trim();
    const messages: ConversationAnalysisMessage[] =
      text.length > 0
        ? buildMessagesFromTranscript(text, call.brokerId, call.clientId)
        : [];

    const ai = runConversationAiEngine({
      conversation: ac,
      memory,
      messages,
      viewerId: call.brokerId,
      counterpartyId: call.clientId,
    });

    const ex = extractPreferencesFromTexts(text.length > 0 ? [text] : []);
    const extracted = buildExtracted(ex, ai);

    const keyPoints: string[] = [];
    for (const line of ai.conversationInsights) {
      if (keyPoints.length >= 5) break;
      keyPoints.push(line);
    }
    if (keyPoints.length === 0) {
      keyPoints.push("No strong automated talking points from this pass — your own notes outrank the model.");
    }

    const durationNote =
      call.durationSec != null && call.durationSec > 0
        ? ` (call length about ${call.durationSec}s, approximate)`
        : "";
    const summary =
      text.length > 0
        ? `A heuristic pass over the call text${durationNote} suggests ${ai.dealStage.stage} as a working stage (review before acting). Engagement-style score is a product signal, not a prediction of a signed deal.`
        : `No call transcript or text was available for analysis${durationNote}. Add a transcript with consent if you want richer, explainable heuristics — the CRM was not auto-updated from empty text.`;

    const result: PostCallAnalysisResult = {
      summary,
      keyPoints,
      objections: ai.objections,
      dealStage: ai.dealStage,
      riskHeatmap: ai.riskHeatmap,
      closingReadiness: ai.closingReadiness,
      coaching: ai.coaching,
      extractedPreferences: extracted,
      sentiment: ai.sentiment,
      dealPrediction: ai.dealPrediction,
    };

    callAiLog.postCallAnalysisCompleted({ callId: call.id, hasTranscript: text.length > 0 });
    return result;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "limited";
    return {
      summary: `A neutral fallback was used (${msg}). This is not legal, financial, or personal advice; review the thread manually. Nothing is auto-executed.`,
      keyPoints: ["Manual review is appropriate when the engine cannot produce a confident read."],
      objections: { objections: [], dominantObjection: null },
      dealStage: { stage: "new", confidence: 0, rationale: [] },
      riskHeatmap: { overallRisk: "low", riskScore: 0, risks: [] },
      closingReadiness: { score: 0, label: "not_ready", rationale: [] },
      coaching: { coaching: [], topCoachingPriority: null },
      extractedPreferences: {
        budgetLabel: null,
        preferredArea: null,
        propertyType: null,
        financingSignals: [],
        urgencyHint: null,
      },
      sentiment: "NEUTRAL",
      dealPrediction: { dealProbability: 0, engagementScore: 0 },
    };
  }
}
