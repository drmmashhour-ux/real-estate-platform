import type { ClientPersonalityType } from "@/modules/personality-closing/personality.types";
import { buildClosingCoachBundle } from "@/modules/personality-closing/personality-response.service";

import type { ClosingFlowContext, ClosingFlowStep, UltimateCloserResult } from "./closing.types";
import {
  computeControlLevel,
  getNextStep,
  shouldAutoClose,
} from "./closing-flow.service";
import { CLOSING_STEP_ORDER, metaForStep, stepIndex } from "./closing-steps.engine";

const HOOK_LINES = {
  BROKER:
    "I’ll be quick — we’re putting active buyer conversations in front of brokers in your market.",
  INVESTOR:
    "I’ll stay tight — here’s why capital partners are tracking this inbound flow.",
} as const;

const VALUE_LINES = {
  BROKER:
    "Not vanity listings — people who already raised their hand and want a conversation.",
  INVESTOR:
    "You get a repeatable pipeline signal — sourced, labeled, ready for your filter.",
} as const;

const QUESTION_LINES = {
  BROKER: "Are you getting enough of those conversations weekly — honestly?",
  INVESTOR: "Where does your funnel usually break — volume, quality, or speed to first call?",
} as const;

const ALIGN_LINES = {
  BROKER: "That’s fair — most brokers tell us the same thing until they see one live handoff.",
  INVESTOR:
    "Makes sense — disciplined investors usually say that until they trace one cohort end to end.",
} as const;

const MICRO_LINES: Record<ClientPersonalityType, string> = {
  DRIVER:
    "Three minutes — I’ll show you how you get clients. If it’s not useful, we stop.",
  ANALYTICAL:
    "I’ll walk you through exactly how leads are generated and how you decide which deserve your time.",
  EXPRESSIVE:
    "This opens a new stream of conversations without ripping out what already works.",
  AMIABLE:
    "No pressure — just take a quick look and decide if it fits how you operate.",
};

const FINAL_LINES = {
  binary: "Does today or tomorrow work for ten minutes — I’ll send the invite either way?",
  DRIVER: "Pick today or tomorrow — I’ll drop the invite while we’re on the phone.",
  ANALYTICAL:
    "Two slots: I’ll send both with agenda + success metric — reply with A or B?",
  EXPRESSIVE: "Lock the momentum — calendar today or tomorrow — which feels better?",
  AMIABLE: "Whenever you’re ready — should I propose two gentle times?",
} as const;

const ALT_POOL: Record<ClosingFlowStep, [string, string]> = {
  hook: [
    "Fair — I’ll keep this under ninety seconds.",
    "Quick context — then one question so I don’t waste you.",
  ],
  value: [
    "Concrete: fewer cold touches, clearer routing to you.",
    "Outcome-first: qualified intent, not another portal browse.",
  ],
  question: [
    "What would ‘enough pipeline’ look like on your desk this quarter?",
    "If nothing changed — what breaks first: speed, trust, or volume?",
  ],
  align: [
    "You’re right — if it’s noisy out there, proof beats pitch.",
    "Totally fair — let’s make this reversible in one step.",
  ],
  micro_close: [
    "Low risk — one screen share, no commitment.",
    "Three minutes — then you choose whether we continue.",
  ],
  final_close: [
    "Today end of day or tomorrow morning — which clears your head better?",
    "Say the word — I’ll paste two times in chat right now.",
  ],
};

function personalityFromContext(ctx: ClosingFlowContext): {
  primary: ClientPersonalityType;
  label: string;
  tone: string;
  confidence: number;
  mergeNote: string;
  avoidPsych: string[];
  adaptedFallback?: string;
} | null {
  const t = ctx.lastProspectInput?.trim();
  if (!t) return null;
  const b = buildClosingCoachBundle(t, ctx.transcriptSnippet);
  if (!b) return null;
  return {
    primary: b.personality.primary,
    label: b.personalityIndicator,
    tone: b.recommendedTone,
    confidence: Math.round((b.detection.confidence + b.personality.confidence) / 2),
    mergeNote: `Psychology: ${b.indicator} · Stage ${b.detection.stage.replace(/_/g, " ")}.`,
    avoidPsych: b.avoidCombined.slice(0, 8),
    adaptedFallback: b.adaptedExampleSentence,
  };
}

function pickMainLine(step: ClosingFlowStep, audience: ClosingFlowContext["audience"], p: ClientPersonalityType): string {
  const micro = MICRO_LINES[p];
  switch (step) {
    case "hook":
      return audience === "INVESTOR" ? HOOK_LINES.INVESTOR : HOOK_LINES.BROKER;
    case "value":
      return audience === "INVESTOR" ? VALUE_LINES.INVESTOR : VALUE_LINES.BROKER;
    case "question":
      return audience === "INVESTOR" ? QUESTION_LINES.INVESTOR : QUESTION_LINES.BROKER;
    case "align":
      return audience === "INVESTOR" ? ALIGN_LINES.INVESTOR : ALIGN_LINES.BROKER;
    case "micro_close":
      return micro;
    case "final_close":
      if (p === "DRIVER") return FINAL_LINES.DRIVER;
      if (p === "ANALYTICAL") return FINAL_LINES.ANALYTICAL;
      if (p === "EXPRESSIVE") return FINAL_LINES.EXPRESSIVE;
      if (p === "AMIABLE") return FINAL_LINES.AMIABLE;
      return FINAL_LINES.binary;
    default:
      return HOOK_LINES.BROKER;
  }
}

const BASE_AVOID = [
  "Explaining instead of guiding",
  "Convincing monologues",
  "Pressure without a reversible next step",
  "Skipping the question (you lose control)",
];

/**
 * Unified closer: flow step + personality/psychology merge + three lines + guardrails.
 */
export function buildUltimateCloserPayload(
  ctx: ClosingFlowContext,
  options?: { lastRepUtteranceSample?: string },
): UltimateCloserResult {
  const stepMeta = getNextStep(ctx);
  const merged = personalityFromContext(ctx);
  const personalityType: ClientPersonalityType = merged?.primary ?? "AMIABLE";

  let mainLine = pickMainLine(stepMeta.step, ctx.audience, personalityType);
  const auto = shouldAutoClose(ctx);
  let effectiveStep = stepMeta.step;
  let effectiveMeta = stepMeta;

  if (auto.close && stepIndex(stepMeta.step) < stepIndex("final_close")) {
    effectiveStep = "final_close";
    effectiveMeta = metaForStep("final_close");
    mainLine = pickMainLine("final_close", ctx.audience, personalityType);
  }

  const alternatives = ALT_POOL[effectiveStep];
  const avoid = [...BASE_AVOID, ...(merged?.avoidPsych ?? [])].slice(0, 12);

  const confidence = merged?.confidence ?? 58;
  const controlLevel = computeControlLevel(options?.lastRepUtteranceSample);

  return {
    step: effectiveStep,
    stepMeta: effectiveMeta,
    mainLine,
    alternatives,
    avoid,
    personalityLabel: merged?.label ?? "🤝 Amiable (default pacing)",
    recommendedTone:
      merged?.tone ??
      "Lead with one question after a tight value line — guide, don’t chase.",
    controlLevel,
    confidenceScore: confidence,
    closeNow: auto.close,
    closeNowReason: auto.reason,
    mergeNote:
      merged?.mergeNote ??
      "Add prospect text for psychology + personality merge — suggestions sharpen automatically.",
  };
}

/** Step checklist for UI rail — marks current index. */
export function closerStepRail(current: ClosingFlowStep): { step: ClosingFlowStep; done: boolean }[] {
  const idx = stepIndex(current);
  return CLOSING_STEP_ORDER.map((step, i) => ({
    step,
    done: i < idx,
  }));
}
