/**
 * Deterministic follow-up suggestions (max 3) — advisory copy only; no outbound sends.
 */

import type { LeadClosingState, LeadFollowUpSuggestion, LeadClosingStage } from "./broker-closing.types";

const MS_HOUR = 60 * 60 * 1000;

export type FollowUpBuildInput = {
  state: LeadClosingState;
  /** Lead contact unlock time (ISO) — optional; improves idle detection. */
  contactUnlockedAt?: string | null;
  nowMs?: number;
};

/** Bounded, deterministic ordering — no marketing guarantees. */
export function buildFollowUpSuggestions(input: FollowUpBuildInput): LeadFollowUpSuggestion[] {
  const nowMs = input.nowMs ?? Date.now();
  const { state } = input;
  const stage: LeadClosingStage = state.stage;
  const out: LeadFollowUpSuggestion[] = [];

  const idleH =
    state.lastContactAt ? (nowMs - Date.parse(state.lastContactAt)) / MS_HOUR : null;

  if (stage === "new") {
    out.push({
      id: "first_contact",
      type: "first_contact",
      title: "First contact",
      description:
        "Reach out with a short introduction and confirm how you can help — copy a draft from messaging assist (you send manually).",
      urgency: "high",
    });
  }

  if (stage === "contacted" && !state.responseReceived) {
    const stale = idleH != null && idleH >= 48;
    out.push({
      id: "follow_up_no_response",
      type: "follow_up",
      title: stale ? "Follow up — no response yet" : "Check in on your last message",
      description:
        "Send a polite follow-up referencing your prior outreach. This is a workflow reminder only — not a promise of reply timing.",
      urgency: stale ? "high" : "medium",
    });
  }

  if (stage === "responded" || stage === "contacted") {
    if (stage === "responded") {
      out.push({
        id: "meeting_push",
        type: "meeting_push",
        title: "Propose a short call or meeting",
        description:
          "Offer a few time options and confirm the best way to connect. Keep expectations neutral — scheduling is subject to mutual availability.",
        urgency: "medium",
      });
    }
  }

  if (stage === "meeting_scheduled" || stage === "negotiation") {
    out.push({
      id: "negotiation_nudge",
      type: "follow_up",
      title: "Keep momentum",
      description:
        "Summarize next steps in writing after each touchpoint so expectations stay clear on both sides.",
      urgency: "medium",
    });
  }

  const terminal = stage === "closed_won" || stage === "closed_lost";
  if (!terminal && idleH != null && idleH >= 72) {
    out.push({
      id: "revive_idle",
      type: "revive_lead",
      title: "Re-engage a quiet lead",
      description:
        "If there has been no activity for several days, send one concise check-in or archive the lead per your policy.",
      urgency: idleH >= 168 ? "medium" : "low",
    });
  }

  // De-dupe by id, cap 3
  const seen = new Set<string>();
  const deduped: LeadFollowUpSuggestion[] = [];
  for (const s of out) {
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    deduped.push(s);
    if (deduped.length >= 3) break;
  }

  void input.contactUnlockedAt;

  return deduped;
}
