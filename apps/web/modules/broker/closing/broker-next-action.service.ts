/**
 * Deterministic next-best-action per lead — advisory labels only; no outcome guarantees.
 */

import type { FollowUpBuildInput } from "./broker-followup.service";
import { buildFollowUpSuggestions } from "./broker-followup.service";
import type { LeadClosingStage, LeadClosingState } from "./broker-closing.types";

const MS_HOUR = 60 * 60 * 1000;

export type BrokerNextActionType =
  | "none"
  | "first_outreach"
  | "follow_up"
  | "push_meeting"
  | "revive"
  | "move_forward"
  | "keep_momentum"
  | "review_terminal"
  | "consider_lost";

/** Maps to messaging-assist hint keys where applicable */
export type BrokerFollowUpDraftHintKind = "first_contact" | "follow_up" | "meeting_push" | "revive_lead" | null;

export type BrokerNextBestAction = {
  actionType: BrokerNextActionType;
  actionLabel: string;
  urgency: "low" | "medium" | "high";
  /** Plain-language “why now” — not a promise */
  reason: string;
  followUpDraftHint: BrokerFollowUpDraftHintKind;
};

export type DailyStripCounts = {
  needsActionToday: number;
  overdueFollowUps: number;
  respondedWaitingNextStep: number;
  highPriorityLeads: number;
};

export type TopThreeToCloseRow = {
  leadId: string;
  name: string;
  score: number;
  stage: LeadClosingStage;
  urgency: "low" | "medium" | "high";
  reason: string;
  actionLabel: string;
};

export function computeIdleHours(state: LeadClosingState, nowMs: number): number | null {
  const anchor = state.lastContactAt ?? state.createdAt;
  const t = Date.parse(anchor);
  if (!Number.isFinite(t)) return null;
  return (nowMs - t) / MS_HOUR;
}

function terminal(stage: LeadClosingStage): boolean {
  return stage === "closed_won" || stage === "closed_lost";
}

/** True when CRM stage reflects a meeting or later active deal work (advisory grouping only). */
export function meetingsMarkedFromStage(stage: LeadClosingStage): boolean {
  return stage === "meeting_scheduled" || stage === "negotiation" || stage === "closed_won";
}

/** Primary next action — max one per lead; deterministic for same inputs. */
export function computeNextBestAction(input: FollowUpBuildInput): BrokerNextBestAction {
  const nowMs = input.nowMs ?? Date.now();
  const { state } = input;
  const stage = state.stage;
  const idleH = computeIdleHours(state, nowMs);

  const suggestions = buildFollowUpSuggestions(input);
  const primarySuggestion = suggestions[0];

  if (terminal(stage)) {
    return {
      actionType: "review_terminal",
      actionLabel: "Pipeline complete for this lead",
      urgency: "low",
      reason: "This lead is marked won or lost — no routine pipeline nudge applies.",
      followUpDraftHint: null,
    };
  }

  if (stage === "new") {
    return {
      actionType: "first_outreach",
      actionLabel: "Send first contact",
      urgency: "high",
      reason: "No outbound logged yet — starting the conversation is the bottleneck.",
      followUpDraftHint: "first_contact",
    };
  }

  if (stage === "contacted") {
    if (state.responseReceived) {
      return {
        actionType: "move_forward",
        actionLabel: "Move to qualified (responded)",
        urgency: "medium",
        reason:
          "Reply signal present — when you’re ready, advance to responded/qualified or propose a concrete next step (stage moves are explicit broker actions).",
        followUpDraftHint: "meeting_push",
      };
    }
    if (idleH != null && idleH >= 72) {
      return {
        actionType: "revive",
        actionLabel: "Revive or escalate follow-up",
        urgency: "high",
        reason: "No reply after several days — one concise check-in or clear next step.",
        followUpDraftHint: primarySuggestion?.type === "revive_lead" ? "revive_lead" : "follow_up",
      };
    }
    if (idleH != null && idleH >= 48) {
      return {
        actionType: "follow_up",
        actionLabel: "Send follow-up",
        urgency: "high",
        reason: "Cadence reminder: follow up after ~48h without response.",
        followUpDraftHint: "follow_up",
      };
    }
    return {
      actionType: "follow_up",
      actionLabel: "Send first follow-up",
      urgency: "medium",
      reason: "Contact logged — confirm receipt and propose a simple next step.",
      followUpDraftHint: "follow_up",
    };
  }

  if (stage === "meeting_scheduled") {
    if (idleH != null && idleH >= 120) {
      return {
        actionType: "revive",
        actionLabel: "Confirm or reschedule the meeting",
        urgency: "high",
        reason:
          "Long idle after a meeting stage — confirm the slot still works or propose fresh times (calendar reality, not a prediction).",
        followUpDraftHint: "follow_up",
      };
    }
    return {
      actionType: "keep_momentum",
      actionLabel: "Prep and confirm the meeting",
      urgency: idleH != null && idleH >= 72 ? "medium" : "medium",
      reason: "Meeting on the books — align agenda, materials, and who attends next.",
      followUpDraftHint: "meeting_push",
    };
  }

  if (stage === "negotiation") {
    return {
      actionType: "keep_momentum",
      actionLabel: "Clarify terms and timeline",
      urgency: idleH != null && idleH >= 96 ? "high" : "medium",
      reason:
        "Active deal discussion — document open points, dates, and dependencies so nothing drifts on memory alone.",
      followUpDraftHint: "follow_up",
    };
  }

  if (stage === "responded") {
    return {
      actionType: "push_meeting",
      actionLabel: "Push for meeting or clear next step",
      urgency: idleH != null && idleH >= 72 ? "high" : "medium",
      reason: "Lead engaged — propose times or confirm how you’ll move forward.",
      followUpDraftHint: "meeting_push",
    };
  }

  if (idleH != null && idleH >= 168) {
    return {
      actionType: "consider_lost",
      actionLabel: "Review or close inactive lead",
      urgency: idleH >= 336 ? "high" : "medium",
      reason: "Long idle time — confirm intent or archive per your policy.",
      followUpDraftHint: "revive_lead",
    };
  }

  return {
    actionType: "follow_up",
    actionLabel: "Review next step",
    urgency: "low",
    reason: primarySuggestion?.description ?? "Use your usual cadence.",
    followUpDraftHint: primarySuggestion?.type === "meeting_push" ? "meeting_push" : "follow_up",
  };
}

export function computeDailyStripCounts(
  rows: Array<{ closing: LeadClosingState; nextAction: BrokerNextBestAction; score: number }>,
  nowMs: number,
): DailyStripCounts {
  let needsActionToday = 0;
  let overdueFollowUps = 0;
  let respondedWaitingNextStep = 0;
  let highPriorityLeads = 0;

  for (const row of rows) {
    const { closing, nextAction, score } = row;
    if (terminal(closing.stage)) continue;

    const idleH = computeIdleHours(closing, nowMs);

    if (nextAction.urgency === "high" || closing.stage === "new") needsActionToday += 1;
    if (closing.stage === "contacted" && !closing.responseReceived && idleH != null && idleH >= 48) {
      overdueFollowUps += 1;
    }
    if (closing.stage === "responded" && idleH != null && idleH >= 24) respondedWaitingNextStep += 1;
    if (score >= 70 && nextAction.urgency !== "low") highPriorityLeads += 1;
  }

  return { needsActionToday, overdueFollowUps, respondedWaitingNextStep, highPriorityLeads };
}

const URGENCY_RANK: Record<"low" | "medium" | "high", number> = { high: 0, medium: 1, low: 2 };

/** Max 3 leads, deterministic sort: urgency → score → leadId. */
export function computeTopThreeToClose(
  rows: Array<{
    leadId: string;
    name: string;
    score: number;
    closing: LeadClosingState;
    nextAction: BrokerNextBestAction;
  }>,
): TopThreeToCloseRow[] {
  const open = rows.filter((r) => !terminal(r.closing.stage));
  const sorted = [...open].sort((a, b) => {
      const ua = URGENCY_RANK[a.nextAction.urgency];
      const ub = URGENCY_RANK[b.nextAction.urgency];
      if (ua !== ub) return ua - ub;
      if (b.score !== a.score) return b.score - a.score;
      return a.leadId.localeCompare(b.leadId);
    });

  return sorted.slice(0, 3).map((r) => ({
    leadId: r.leadId,
    name: r.name,
    score: r.score,
    stage: r.closing.stage,
    urgency: r.nextAction.urgency,
    reason: r.nextAction.reason,
    actionLabel: r.nextAction.actionLabel,
  }));
}
