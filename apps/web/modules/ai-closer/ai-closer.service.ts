import { buildCloserExplanation } from "./ai-closer-explainability.service";
import {
  evaluateVisitIntent,
  fetchAvailableSlotsForLead,
  fetchNoShowContextForLead,
  generateBookingPrompt,
} from "./ai-closer-booking.service";
import { evaluateCloserEscalation } from "./ai-closer-escalation.service";
import { recordAiCloserEvent } from "./ai-closer-log.service";
import { detectObjection, getObjectionPlaybook } from "./ai-closer-objection.service";
import { generateCloserResponses } from "./ai-closer-response.service";
import { detectCloserStage, updateCloserStage } from "./ai-closer-stage.service";
import type {
  AiCloserAssistOutput,
  AiCloserPersonalityHint,
  AiCloserRouteContext,
  AiCloserStageContext,
} from "./ai-closer.types";
import { BROKER_CONVERSION_PROMPT_EN } from "@/modules/legal-boundary/broker-conversion.service";
import { getAllowedCapabilities } from "@/modules/legal-boundary/compliance-capability-guard";
import { writeLegalBoundaryAudit } from "@/modules/legal-boundary/legal-boundary-audit.service";
import { getOrSyncTransactionContext } from "@/modules/legal-boundary/transaction-context.service";

const DISCLOSURE =
  "LECIPM assistant — automation to help reps close ethically; not a licensed broker; no outbound robocalls.";

function lastSegment(input: { transcript?: string; messages?: string[] }): string {
  if (input.messages?.length) {
    return input.messages[input.messages.length - 1]?.trim() ?? "";
  }
  const lines = (input.transcript ?? "").trim().split(/\n+/);
  return lines[lines.length - 1]?.trim() ?? "";
}

function inferPersonality(text: string): AiCloserPersonalityHint {
  if (/\b(data|numbers|compare|spreadsheet|exact)\b/i.test(text)) return "analytical";
  if (/\b(fast|quick|bottom line|today)\b/i.test(text)) return "driver";
  if (/[!]{2,}|\b(love|excited|amazing)\b/i.test(text)) return "expressive";
  if (/\b(feel|worried|family|comfortable)\b/i.test(text)) return "amiable";
  return "unknown";
}

export type GetCloserAssistInput = {
  transcript?: string;
  messages?: string[];
  leadId?: string;
  route: AiCloserRouteContext;
  personalityHint?: AiCloserPersonalityHint;
  listingHint?: string;
  visitIntent?: boolean;
  bookingAttempts?: number;
  clickSignals?: number;
  timelineUrgency?: "low" | "medium" | "high";
  hotLead?: boolean;
  optedOut?: boolean;
  persistStage?: boolean;
  listingId?: string;
};

function buildFsboLegalBoundaryCloserOutput(): AiCloserAssistOutput {
  const explanation = buildCloserExplanation({
    stage: "ESCALATE_TO_BROKER",
    stageReasons: ["legal_boundary_fsbo"],
    objection: "human_requested",
    objectionSignals: ["licensing_boundary"],
    mainLineRationale:
      "Negotiation coaching is disabled for independent (non-broker) transactions under LECIPM OACIQ safeguards.",
    shouldBook: false,
    softBook: false,
    shouldEscalate: true,
    escalateWhy: "Licensed brokerage activity requires an OACIQ broker of record on the file.",
    confidenceSignals: ["legal_boundary"],
  });

  return {
    assistantDisclosure: DISCLOSURE,
    detectedStage: "ESCALATE_TO_BROKER",
    objection: "human_requested",
    response: {
      main:
        "For negotiation strategy, offers, and contract steps in Québec, this file must be handled under a licensed real estate broker (OACIQ). You can still use listing display, neutral messaging, and basic calculators.",
      alternatives: [
        "Ask a neutral factual question about the property or logistics.",
        BROKER_CONVERSION_PROMPT_EN,
      ],
      bestCta: "Request broker assistance",
      confidence: 0.95,
    },
    nextBestQuestion: BROKER_CONVERSION_PROMPT_EN,
    confidence: 0.95,
    shouldEscalate: true,
    shouldAttemptBooking: false,
    escalation: {
      target: "broker",
      reason: "LECIPM_LEGAL_BOUNDARY_FSBO",
      urgency: "medium",
    },
    explanation,
    legalBoundary: {
      mode: "FSBO",
      blockedCapability: "negotiation_ai",
      brokerConversionPrompt: true,
    },
  };
}

export async function getCloserAssist(input: GetCloserAssistInput): Promise<AiCloserAssistOutput> {
  const listingIdRaw = input.listingId?.trim();
  if (listingIdRaw) {
    const txCtx = await getOrSyncTransactionContext({ entityType: "LISTING", entityId: listingIdRaw });
    const caps = getAllowedCapabilities(txCtx);
    if (!caps.negotiationAi) {
      await writeLegalBoundaryAudit({
        actionType: "negotiation_ai",
        entityId: listingIdRaw,
        entityType: "LISTING",
        mode: txCtx.mode,
        allowed: false,
        reason: "fsbo_neutral_tooling_only",
        actorUserId: null,
      });
      return buildFsboLegalBoundaryCloserOutput();
    }
  }

  const last = lastSegment(input);
  const objection = detectObjection(last);
  const personality = input.personalityHint ?? inferPersonality(last);

  const ctx: AiCloserStageContext = {
    messages: input.messages,
    transcript: input.transcript,
    visitIntent: input.visitIntent,
    bookingAttempts: input.bookingAttempts,
    clickSignals: input.clickSignals,
    timelineUrgency: input.timelineUrgency,
    objectionKey: objection,
    optedOut: input.optedOut,
  };

  const { stage, reasons: stageReasons } = detectCloserStage(ctx);

  const pack = generateCloserResponses({
    stage,
    objection,
    route: input.route,
    personality,
    listingHint: input.listingHint,
  });

  const visitEval = evaluateVisitIntent(stage, last);
  const shouldAttemptBooking =
    stage === "READY_TO_BOOK" || visitEval.ready || /book|visit|showing/i.test(last);

  const softBook = stage === "HESITATING" && shouldAttemptBooking === false;

  let confidence = pack.confidence;
  if (input.hotLead) confidence = Math.min(0.95, confidence + 0.08);
  if (input.optedOut) confidence = 0.1;

  const esc = evaluateCloserEscalation({
    stage,
    objection,
    confidence,
    route: input.route,
    hotLead: input.hotLead,
    visitRequested: visitEval.ready,
  });

  const bookingPrompt = generateBookingPrompt({
    stage,
    route: input.route,
    preferredChannel: "email",
  });

  const mainLineRationale =
    objection !== "none"
      ? `Objection playbook (${objection}) merged with stage ${stage}.`
      : `Stage-based script (${stage}) for route ${input.route}.`;

  const explanation = buildCloserExplanation({
    stage,
    stageReasons,
    objection,
    objectionSignals: objection !== "none" ? ["keyword_match"] : [],
    mainLineRationale,
    shouldBook: shouldAttemptBooking && !esc.shouldEscalate,
    softBook,
    shouldEscalate: esc.shouldEscalate,
    escalateWhy: esc.reason,
    confidenceSignals: [
      ...stageReasons,
      `objection=${objection}`,
      `route=${input.route}`,
      personality !== "unknown" ? `personality_hint=${personality}` : "",
    ].filter(Boolean),
  });

  const playbook = objection !== "none" ? getObjectionPlaybook(objection) : null;
  const nextBestQuestion = playbook?.nextStep ?? pack.alternatives[0];

  const out: AiCloserAssistOutput = {
    assistantDisclosure: DISCLOSURE,
    detectedStage: stage,
    objection,
    response: {
      main: pack.main,
      alternatives: [pack.alternatives[0], pack.alternatives[1]],
      bestCta: pack.bestCta,
      confidence,
    },
    nextBestQuestion,
    confidence,
    shouldEscalate: esc.shouldEscalate,
    shouldAttemptBooking: shouldAttemptBooking && !input.optedOut,
    escalation: esc.shouldEscalate
      ? { target: esc.target, reason: esc.reason, urgency: esc.urgency }
      : undefined,
    bookingPrompt,
    explanation,
  };

  const shouldLoadRealSlots =
    input.leadId &&
    input.listingId &&
    out.shouldAttemptBooking &&
    !esc.shouldEscalate &&
    !input.optedOut;
  if (input.leadId) {
    const ns = await fetchNoShowContextForLead(input.leadId);
    if (ns && (ns.nudge || ns.hasHighRisk)) {
      out.noShowAssist = {
        visitId: ns.visitId,
        nudge: ns.nudge,
        riskBand: ns.riskBand,
      };
    }
  }

  if (shouldLoadRealSlots) {
    const slotPack = await fetchAvailableSlotsForLead({ leadId: input.leadId, listingId: input.listingId });
    if (slotPack) {
      out.bookingSlotSuggestion = {
        message: slotPack.message,
        lines: slotPack.lines,
        brokerId: slotPack.brokerId,
        availabilityNote: slotPack.availabilityNote,
      };
      if (slotPack.message && (stage === "READY_TO_BOOK" || visitEval.ready)) {
        out.response = {
          ...out.response,
          main: slotPack.message,
        };
      }
    }
  }

  if (input.leadId) {
    await recordAiCloserEvent(input.leadId, "AI_CLOSER_RECOMMENDATION", {
      detectedStage: stage,
      objection,
      shouldEscalate: esc.shouldEscalate,
      shouldAttemptBooking: out.shouldAttemptBooking,
      confidence,
      route: input.route,
    });
    if (input.persistStage !== false) {
      await updateCloserStage(input.leadId, ctx);
    }
  }

  return out;
}
