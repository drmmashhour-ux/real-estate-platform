/**
 * Maps assist context to messaging-assist hint keys + plain-language angles (draft-only).
 */

import type { BrokerNextBestAction } from "@/modules/broker/closing/broker-next-action.service";

export type DraftHintKind = "first_contact" | "follow_up" | "meeting_push" | "revive_lead";

export type DraftHintResult = {
  hint: DraftHintKind | null;
  plainAngle: string;
};

export function mapSuggestionToDraftHint(nextAction: BrokerNextBestAction): DraftHintResult {
  const h = nextAction.followUpDraftHint;
  if (h === "first_contact") {
    return {
      hint: "first_contact",
      plainAngle: "Introduce yourself briefly, reference their inquiry, offer one clear next step.",
    };
  }
  if (h === "follow_up") {
    return {
      hint: "follow_up",
      plainAngle: "Reference your last message, add one new helpful detail, propose a specific time or question.",
    };
  }
  if (h === "meeting_push") {
    return {
      hint: "meeting_push",
      plainAngle: "Propose 2–3 time windows and a one-line agenda so the client can say yes quickly.",
    };
  }
  if (h === "revive_lead") {
    return {
      hint: "revive_lead",
      plainAngle: "Acknowledge the gap, offer a low-friction option, avoid guilt language.",
    };
  }

  return {
    hint: null,
    plainAngle: "Keep the message short, factual, and focused on one ask.",
  };
}
