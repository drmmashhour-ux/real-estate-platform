/**
 * Concise coaching copy — no manipulation tactics; broker stays in control.
 */

import type { LeadClosingStage } from "@/modules/broker/closing/broker-closing.types";

export type ObjectionGuidance = {
  situation: string;
  whatToSayNext: string;
  whatToAvoid: string;
};

export type ObjectionHelpInput = {
  stage: LeadClosingStage;
  responseReceived: boolean;
  idleHours: number | null;
};

export function buildObjectionGuidance(input: ObjectionHelpInput): ObjectionGuidance {
  const { stage, responseReceived, idleHours } = input;

  if (stage === "new") {
    return {
      situation: "Lead not yet contacted",
      whatToSayNext: "Short, specific note: who you are, why you’re reaching out, one clear ask (time or question).",
      whatToAvoid: "Long brochures or multiple asks in the first touch.",
    };
  }

  if (stage === "contacted") {
    if (!responseReceived) {
      const idleNote =
        idleHours != null && idleHours >= 48
          ? "It’s been a few days — one polite bump with a single new piece of value or question."
          : "One concise follow-up referencing your last note and offering two time options.";
      return {
        situation: "No reply signal yet",
        whatToSayNext: idleNote,
        whatToAvoid: "Repeated walls of text or pressure language.",
      };
    }
    return {
      situation: "Interested but conversation still early",
      whatToSayNext: "Mirror their last point, then propose one next step (call slot or short list of options).",
      whatToAvoid: "Jumping to pricing or commitment before scope is clear.",
    };
  }

  if (stage === "responded") {
    return {
      situation: "Engaged — next step clarity",
      whatToSayNext: "Offer 2–3 concrete times or a short agenda for a call; confirm how they prefer to communicate.",
      whatToAvoid: "Vague ‘checking in’ without a proposed move.",
    };
  }

  if (stage === "meeting_scheduled") {
    return {
      situation: "Meeting not yet held or confirm pending",
      whatToSayNext: "Send a tight reminder with location/link, duration, and what you’ll cover.",
      whatToAvoid: "Assuming confirmation without a clear yes.",
    };
  }

  if (stage === "negotiation") {
    return {
      situation: "Active deal discussion",
      whatToSayNext: "Summarize agreed points in writing and label open items — keeps momentum without over-promising.",
      whatToAvoid: "Informal commitments you can’t document later.",
    };
  }

  return {
    situation: "Pipeline stage",
    whatToSayNext: "Keep touches short, dated, and focused on one next step.",
    whatToAvoid: "Over-automation language or guarantees you can’t keep.",
  };
}
