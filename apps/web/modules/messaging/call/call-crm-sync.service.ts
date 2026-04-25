import { mergeExtractedPreferences, mergeAssistantHeuristicSnapshot, type AssistantHeuristicSnapshotV1 } from "@/modules/messaging/crm-memory/memory.engine";
import { recordConversationActionAssignment } from "@/modules/messaging/assistant/conversation-action-assignment.service";
import { extractPreferencesFromTexts } from "@/modules/crm-memory/preference.extractor";
import type { PostCallAnalysisResult } from "@/modules/messaging/call/call.types";
import { callAiLog } from "@/modules/messaging/call/call-ai-logger";

function buildHeuristicFromPostCall(result: PostCallAnalysisResult, hasBudgetFromExtraction: boolean): AssistantHeuristicSnapshotV1 {
  const priceO = result.objections.objections.filter((o) => o.type === "price" && o.severity !== "low");
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    source: "post_call_engine",
    dominantObjection: result.objections.dominantObjection,
    budgetConfidence: priceO.length > 0 ? "low" : hasBudgetFromExtraction ? "high" : "medium",
    financingReadinessHint: result.objections.objections.some((o) => o.type === "financing" && o.confidence >= 0.4)
      ? "uncertain"
      : "unknown",
    urgencyLevel:
      result.closingReadiness.label === "near_closing"
        ? "high"
        : result.closingReadiness.label === "not_ready"
          ? "low"
          : "medium",
    propertyFitIssue: result.objections.objections.some((o) => o.type === "property_fit"),
  };
}

/**
 * Best-effort CRM memory merge: never overwrites strong user prefs blindly (handled in mergeExtractedPreferences).
 * Optional follow-up assignment — recommend-only; execution stays manual.
 * Never throws.
 */
export async function applyPostCallCrmSync(args: {
  clientId: string;
  brokerId: string;
  conversationId: string;
  callId: string;
  result: PostCallAnalysisResult;
  transcriptText?: string;
  didConsentTranscript: boolean;
}): Promise<void> {
  const { clientId, brokerId, conversationId, callId, result, transcriptText, didConsentTranscript } = args;
  try {
    const texts: string[] = didConsentTranscript && (transcriptText?.trim() ?? "")
      ? [transcriptText!.trim().slice(0, 12_000)]
      : [];
    if (texts.length > 0) {
      await mergeExtractedPreferences({ clientId, brokerId, messageTexts: texts });
    }

    const ex = extractPreferencesFromTexts(texts);
    const hasBudgetFromExtraction = Boolean(
      (ex.budgetLabel && ex.budgetLabel.length > 0) || (result.extractedPreferences.budgetLabel && result.extractedPreferences.budgetLabel.length)
    );
    const snap = buildHeuristicFromPostCall(result, hasBudgetFromExtraction);
    await mergeAssistantHeuristicSnapshot({ clientId, brokerId, snapshot: snap });

    const needFollowUp =
      result.riskHeatmap.overallRisk === "high" || result.dealStage.stage === "stalled" || result.dealStage.stage === "lost_risk";
    if (needFollowUp || /visit|schedule|listings/i.test(result.dealStage.rationale.join(" ") + result.summary)) {
      void recordConversationActionAssignment({
        userId: brokerId,
        conversationId,
        event: "action_executed",
        detail: {
          callId,
          context: "post_call_copilot",
          actionLabel: "Follow up after call (suggested, not auto-scheduled)",
          nextStepHint: "Review post-call heuristics and plan the next message or visit; nothing is sent automatically.",
        },
      });
    }
  } catch (e) {
    callAiLog.warn("post_call_crm_sync_skipped", {
      callId,
      err: e instanceof Error ? e.message : String(e),
    });
  }
}
