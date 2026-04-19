/**
 * Orchestrates signals + suggestions — advisory only; no CRM side effects.
 */

import type { BrokerNextBestAction } from "@/modules/broker/closing/broker-next-action.service";
import { computeIdleHours } from "@/modules/broker/closing/broker-next-action.service";
import type { LeadClosingState } from "@/modules/broker/closing/broker-closing.types";
import { buildBrokerAiLeadSignals } from "./broker-ai-lead-signals.service";
import { mapSuggestionToDraftHint } from "./broker-ai-draft-hints.service";
import { buildObjectionGuidance } from "./broker-ai-objection-help.service";
import {
  recordAssistSummaryBuilt,
  recordDraftHintMapped,
  recordObjectionHelpShown,
} from "./broker-ai-assist-monitoring.service";
import type {
  BrokerAiAssistConfidence,
  BrokerAiAssistSuggestion,
  BrokerAiAssistSummary,
  BrokerAiAssistUrgency,
} from "./broker-ai-assist.types";

export type AssistLeadInput = {
  leadId: string;
  name: string;
  score: number;
  closing: LeadClosingState;
  nextAction: BrokerNextBestAction;
  nowMs: number;
};

function confidenceFromAction(next: BrokerNextBestAction, idleKnown: boolean): BrokerAiAssistConfidence {
  if (!idleKnown && next.urgency !== "high") return "low";
  if (next.urgency === "high") return "high";
  if (next.urgency === "medium") return "medium";
  return "low";
}

function urgencyFromSignal(severity: string): BrokerAiAssistUrgency {
  if (severity === "high") return "high";
  if (severity === "medium") return "medium";
  return "low";
}

const RISK_TYPES = new Set(["cooling_down", "no_response_risk", "stalled_after_contact"]);

export function buildBrokerAiAssistSummary(input: AssistLeadInput): BrokerAiAssistSummary {
  const { leadId, closing, score, nextAction, nowMs } = input;
  const idleH = computeIdleHours(closing, nowMs);

  const topSignals = buildBrokerAiLeadSignals({ leadId, closing, score, nowMs }).slice(0, 3);

  const objection = buildObjectionGuidance({
    stage: closing.stage,
    responseReceived: closing.responseReceived,
    idleHours: idleH,
  });

  const draft = mapSuggestionToDraftHint(nextAction);
  recordDraftHintMapped();

  const nextStep: BrokerAiAssistSuggestion = {
    id: `${leadId}-next-step`,
    leadId,
    type: "next_step",
    title: nextAction.actionLabel,
    description: nextAction.reason,
    confidenceLevel: confidenceFromAction(nextAction, idleH != null),
    urgency: nextAction.urgency,
    rationale: "Based on closing stage, idle hours, and existing follow-up rules — not a prediction of outcomes.",
    suggestedAction: `Review lead ${input.name || leadId} and apply: ${nextAction.actionLabel}.`,
    draftHint: nextAction.followUpDraftHint ?? undefined,
    safeOnly: true,
  };

  const messageHint: BrokerAiAssistSuggestion = {
    id: `${leadId}-message-hint`,
    leadId,
    type: "message_hint",
    title: "Draft angle (manual send)",
    description: draft.plainAngle,
    confidenceLevel: draft.hint ? "medium" : "low",
    urgency: nextAction.urgency,
    rationale: "Angle only — you write and send the message.",
    suggestedAction: "Open your draft flow or paste into your channel manually.",
    draftHint: draft.hint ?? undefined,
    safeOnly: true,
  };

  const riskSig = topSignals.find((s) => RISK_TYPES.has(s.signalType));
  const riskSuggestion: BrokerAiAssistSuggestion | null = riskSig
    ? {
        id: `${leadId}-risk`,
        leadId,
        type: "risk_alert",
        title: riskSig.label,
        description: riskSig.description,
        confidenceLevel: idleH != null ? "medium" : "low",
        urgency: urgencyFromSignal(riskSig.severity),
        rationale: "Pattern match on idle time and stage — advisory only.",
        suggestedAction: "Prioritize a short, factual touch or document intentional pause.",
        safeOnly: true,
      }
    : null;

  const objectionSuggestion: BrokerAiAssistSuggestion = {
    id: `${leadId}-objection`,
    leadId,
    type: "objection_help",
    title: objection.situation,
    description: `${objection.whatToSayNext} Avoid: ${objection.whatToAvoid}`,
    confidenceLevel: "medium",
    urgency: "low",
    rationale: "General coaching — adapt to your market and compliance rules.",
    suggestedAction: objection.whatToSayNext,
    safeOnly: true,
  };

  let topSuggestions: BrokerAiAssistSuggestion[];
  if (riskSuggestion) {
    topSuggestions = [nextStep, riskSuggestion, messageHint];
  } else {
    topSuggestions = [nextStep, messageHint, objectionSuggestion];
    recordObjectionHelpShown();
  }

  const primaryRecommendation = `Suggested: ${nextAction.actionLabel} — ${nextAction.reason}`;

  recordAssistSummaryBuilt({
    signalCount: topSignals.length,
    suggestionCount: topSuggestions.length,
  });

  return {
    leadId,
    topSignals,
    topSuggestions,
    primaryRecommendation,
  };
}
