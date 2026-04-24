import type { ConversationAnalysisResult } from "@/modules/messaging/analysis/conversation-analysis.engine";
import { messagingAiLog } from "./messaging-ai-logger";
import {
  getNextBestAction,
  type AssistantConversationShape,
  type MemorySnapshotShape,
  type NextBestActionResult,
} from "./next-action.service";

export type SuggestionTone = "friendly" | "professional" | "urgent";
export type SuggestionGoalType =
  | "objection_handling"
  | "re_engagement"
  | "visit_scheduling"
  | "qualification_followup"
  | "closing_nudge"
  | "general_checkin";

export type MessageSuggestion = {
  message: string;
  tone: SuggestionTone;
  goal: string;
  /** One-line trace for the broker: why this shape was chosen (suggestion only). */
  reason: string;
  goalType: SuggestionGoalType;
};

export type MessageSuggestionContext = {
  conversation: AssistantConversationShape;
  analysis: ConversationAnalysisResult;
  memory: MemorySnapshotShape;
  hasListingContext: boolean;
  nextBestActionOverride?: NextBestActionResult;
  dealStageKey?: string | null;
  dominantObjection?: string | null;
  riskOverall?: "low" | "medium" | "high" | null;
  coachingTop?: string | null;
};

/**
 * Suggestion-only phrasing. Does not auto-send. Avoids financial or legal claims.
 */
export function generateMessageSuggestion(context: MessageSuggestionContext): MessageSuggestion {
  try {
    const nba =
      context.nextBestActionOverride ??
      getNextBestAction(
        {
          ...context.conversation,
          type: context.conversation.type ?? (context.hasListingContext ? "LISTING" : null),
        },
        context.analysis,
        context.memory
      );

    const stage = context.dealStageKey ?? "";
    const risk = context.riskOverall;
    const dom = context.dominantObjection;

    let goalType: SuggestionGoalType = "general_checkin";
    let goal = "keep the conversation useful";
    let reason = "Matched to the next best action hint the engine chose for this thread (you still edit).";

    if (stage === "stalled" || stage === "lost_risk" || risk === "high") {
      goalType = "re_engagement";
      goal = "re-engagement (light touch)";
      reason = "Stage or risk read suggests a gentle, non-pushy check-in; not a claim about the contact’s intent.";
    } else if (dom === "price" || dom === "property_fit" || nba.action.toLowerCase().includes("objection") || nba.action.toLowerCase().includes("concern")) {
      goalType = "objection_handling";
      goal = "acknowledge concerns in neutral, factual language";
      reason = "A concern- or value-related signal was heuristically detected; stay descriptive, not advisory.";
    } else if (stage === "visit_ready" || nba.action.toLowerCase().includes("visit")) {
      goalType = "visit_scheduling";
      goal = "propose a concrete, optional visit or call window";
      reason = "The thread or action hint mentioned scheduling or a visit; offer times without guaranteeing availability of the property or parties.";
    } else if (stage === "qualified" || stage === "discovery") {
      goalType = "qualification_followup";
      goal = "align on one missing detail (area, type, or timing) without prying";
      reason = "Fits a discovery- or qualified-stage read from recent wording and memory hints; confirm instead of assume.";
    } else if (stage === "negotiation" || stage === "closing" || nba.action.toLowerCase().includes("follow")) {
      goalType = "closing_nudge";
      goal = "small, respectful next step toward agreement (wording only)";
      reason = "Later-funnel heuristics: keep the tone steady and let the client choose pace — not a legal or money promise.";
    }

    if (nba.action.includes("visit") && goalType === "general_checkin") {
      goalType = "visit_scheduling";
      goal = "schedule a visit";
      reason = "The engine proposed a visit-oriented action for this pass.";
    }
    if (/follow|check/i.test(nba.action) && goalType === "general_checkin") {
      goalType = "re_engagement";
      goal = "polite follow-up";
      reason = "Follow-up-style action: short, add value, no pressure language.";
    }

    const tone: SuggestionTone =
      nba.priority === "high" && (goalType === "objection_handling" || goalType === "visit_scheduling")
        ? "professional"
        : nba.priority === "high" && goalType === "re_engagement"
          ? "urgent"
          : "friendly";

    const base = (nba.suggestedMessage ?? "Thanks for your message — I can help with the next step on your side when you are ready.").trim();
    if (context.coachingTop) {
      reason = `${reason} (Coaching nudge: ${context.coachingTop.slice(0, 120)}${context.coachingTop.length > 120 ? "…" : ""})`;
    }

    messagingAiLog.messageSuggested({ conversationId: context.conversation.id, goal, tone, goalType });
    return { message: base, tone, goal, reason, goalType };
  } catch (e) {
    messagingAiLog.warn("message_suggest_fallback", { err: e instanceof Error ? e.message : String(e) });
    return {
      message: "Thanks for getting in touch. What would you like to focus on next in this thread?",
      tone: "professional",
      goal: "open-ended follow-up",
      reason: "A neutral fallback: heuristics were unavailable; please edit before sending — nothing is sent automatically.",
      goalType: "general_checkin",
    };
  }
}
