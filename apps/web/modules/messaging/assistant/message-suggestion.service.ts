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
  /** When the thread is linked to a deal, optional deal-closer top action (suggestion only). */
  dealCloserTopActionKey?: string | null;
  dealCloserPushRisk?: "low" | "medium" | "high" | null;
  /** Top offer-strategy recommendation key when thread is deal-linked. */
  offerStrategyTopKey?: string | null;
  offerStrategyCompetitiveLevel?: "low" | "medium" | "high" | null;
  /** When the thread is deal-linked, negotiation-simulator heuristics (suggest-only, not a forecast). */
  negotiationSafestApproach?: string | null;
  negotiationHighestUpsideApproach?: string | null;
  negotiationMomentumLevel?: "low" | "medium" | "high" | null;
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
    const dca = context.dealCloserTopActionKey;
    const dpr = context.dealCloserPushRisk;
    const osk = context.offerStrategyTopKey;
    const ocl = context.offerStrategyCompetitiveLevel;
    const nSafe = context.negotiationSafestApproach;
    const nUp = context.negotiationHighestUpsideApproach;
    const nMom = context.negotiationMomentumLevel;

    let goalType: SuggestionGoalType = "general_checkin";
    let goal = "keep the conversation useful";
    let reason = "Matched to the next best action hint the engine chose for this thread (you still edit).";

    if (osk) {
      if (osk === "clarify_financing_before_offer") {
        goalType = "qualification_followup";
        goal = "clarify next steps with a lender (process, not rates)";
        reason = "Offer strategy suggested clarifying financing workflow — not credit advice; you edit and send nothing automatically.";
      } else if (osk === "propose_offer_discussion" || osk === "prepare_soft_offer_conversation") {
        goalType = "closing_nudge";
        goal = "soft language for a how-offers-work conversation (not a submission)";
        reason = "Offer strategy points to an offer discussion shape — you remain responsible for compliance and content.";
      } else if (osk === "address_price_concern" || osk === "encourage_visit_before_offer") {
        goalType = osk === "encourage_visit_before_offer" ? "visit_scheduling" : "objection_handling";
        goal = osk === "encourage_visit_before_offer" ? "optional visit planning" : "value/inclusions in neutral terms";
        reason = "Offer strategy nudges visit or value alignment before offer mechanics — not a market guarantee.";
      } else if (osk === "pause_and_nurture" || osk === "follow_up_today") {
        goalType = "re_engagement";
        goal = osk === "follow_up_today" ? "timely, calm follow-up" : "nurture without a hard offer push";
        reason = "Offer strategy suggested re-engagement; competitive context is " + (ocl ?? "not loaded") + " in this read — still descriptive only.";
      } else if (osk === "create_urgency_with_market_context") {
        goalType = "re_engagement";
        goal = "factual, timely check-in (no market promises)";
        reason =
          ocl === "high"
            ? "Competition-style risk is elevated in hints — keep tone calm; do not claim facts you have not verified."
            : "A timely touch without inventing comparables or other parties’ offers.";
      } else if (osk === "involve_decision_maker") {
        goalType = "qualification_followup";
        goal = "clarify who else needs to align (lightly)";
        reason = "Offer strategy flagged decision-maker scoping; keep it optional and respectful.";
      } else if (osk) {
        reason = "Offer strategy produced a next-step key this template does not override — you still lead tone and content.";
      }
    } else if (dca) {
      if (dca === "involve_decision_maker" || dca === "confirm_decision_timeline") {
        goalType = "qualification_followup";
        goal = "clarify who decides and on what timeline (no pressure language)";
        reason = "Deal closer suggested a light process-alignment check — not prescriptive (no auto-send).";
      } else if (dca === "resolve_price_objection" || dca === "recommend_better_fit_listings") {
        goalType = "objection_handling";
        goal = "address fit or value in neutral, factual terms";
        reason = "Deal closer suggested a fit/value pass; stay descriptive — not prescriptive (no auto-send).";
      } else if (dca === "schedule_visit") {
        goalType = "visit_scheduling";
        goal = "propose a visit window you can actually confirm";
        reason = "Deal closer suggested a visit focus — offer times; do not imply property access is guaranteed.";
      } else if (dca === "re_engage_client" || dca === "pause_and_nurture") {
        goalType = "re_engagement";
        goal = "soft re-engagement";
        reason = "Deal closer points to rebuild momentum or nurture before a hard ask — you edit before sending.";
      } else if (dca === "clarify_financing") {
        goalType = "qualification_followup";
        goal = "clarify next process step (not credit advice)";
        reason = "Deal closer flagged financing process clarity; avoid rates or approval language.";
      } else if (dca === "propose_offer_discussion") {
        if (dpr === "high") {
          goalType = "re_engagement";
          goal = "stabilize the thread before offer-style language";
          reason = "Deal closer marked premature push risk as high — prefer a softer line than an offer nudge; not legal or financial advice.";
        } else {
          goalType = "closing_nudge";
          goal = "wording for a conversation about next step (not an offer on its own)";
          reason = "Deal closer supports a late-funnel nudge; you still lead — not legal or financial advice.";
        }
      } else {
        reason = "Deal closer hint applied where available; still match your CRM notes and compliance rules.";
      }
    } else if (nUp || nSafe) {
      const k = nUp ?? nSafe;
      if (k === "objection_first") {
        goalType = "objection_handling";
        goal = "invite the client to share concerns in neutral, respectful language";
        reason = "Negotiation sim leaned objection-first; this is a wording hint only — you edit, nothing auto-sends, not a guarantee of response.";
      } else if (k === "value_reinforcement") {
        goalType = nMom === "high" ? "re_engagement" : "closing_nudge";
        goal = nMom === "high" ? "short value re-anchor before a light next step" : "value/fit re-anchor without pressure or promises";
        reason =
          nMom === "high"
            ? "Simulator highlighted value framing with elevated momentum risk — still descriptive only, not a market or legal claim."
            : "Simulator nudged value reinforcement; match your local facts, no invented comparables.";
      } else if (k === "visit_push") {
        goalType = "visit_scheduling";
        goal = "optional, concrete visit or on-site follow-up (only what you can confirm)";
        reason = "Negotiation sim suggested a visit path where fit is uncertain — you confirm availability, no access guarantees.";
      } else if (k === "timing_pause" && (nSafe === "timing_pause" || nMom === "high")) {
        goalType = "re_engagement";
        goal = nMom === "high" ? "ultra-light touch or a pause to avoid a rush read" : "nurture tone without a hard next-step ask";
        reason =
          nMom === "high" && nSafe === "timing_pause"
            ? "A pause is flagged as risky with momentum/comparison signals — you may still choose nurture; this is a coaching hint, not a rule."
            : "Sim suggested slower cadence; you remain fully in control of when to message — nothing auto-sends.";
      } else if (k === "firm_follow_up") {
        goalType = "qualification_followup";
        goal = "one clear, respectful ask for the next small commitment";
        reason = "Firm follow-up in the negotiation sim: keep tone clear but not coercive — you edit before sending.";
      } else if (k === "soft_follow_up" && nMom && nMom !== "low") {
        goalType = "re_engagement";
        goal = "gentle check-in to protect momentum (no new promises)";
        reason = "Sim suggests soft follow-up in a read with some momentum concern — not a performance guarantee.";
      } else {
        reason =
          "Negotiation simulator produced approach hints you can line up with your read — " +
          (nUp && nSafe ? `highest-lean: ${nUp}, lower-friction: ${nSafe} —` : "") +
          " you lead tone; nothing auto-sends; not a forecast.";
      }
    } else if (stage === "stalled" || stage === "lost_risk" || risk === "high") {
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
