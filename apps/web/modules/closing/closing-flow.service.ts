import { detectClientPsychology } from "@/modules/sales-psychology/psychology-detection.service";

import type { ClosingFlowContext, ClosingFlowStep, ClosingStepMeta } from "./closing.types";
import {
  CLOSING_STEP_ORDER,
  defaultStepFromCallStage,
  metaForStep,
  stepIndex,
} from "./closing-steps.engine";

const OBJECTIONISH =
  /\b(not interested|busy|no time|already have|send(?:\s+me)?\s+an?\s+email|just\s+email|stop calling)\b/i;
const READY = /\b(book|calendar|invite|schedule|today|tomorrow|works for me|let'?s do|demo)\b/i;

/**
 * Primary closer step for this moment — respects manual override, objection routing, readiness.
 */
export function getNextStep(ctx: ClosingFlowContext): ClosingStepMeta {
  if (ctx.closerStepOverride) return metaForStep(ctx.closerStepOverride);

  const last = (ctx.lastProspectInput ?? "").trim();
  const combined = `${last}\n${ctx.transcriptSnippet ?? ""}`.toLowerCase();

  if (last && OBJECTIONISH.test(combined)) {
    return metaForStep("align");
  }

  if (last) {
    const psych = detectClientPsychology(last, ctx.transcriptSnippet);
    if (psych.stage === "ready_to_decide" || psych.primaryState === "interested") {
      return metaForStep("final_close");
    }
    if (psych.primaryState === "defensive" || psych.primaryState === "skeptical") {
      return metaForStep("align");
    }
  }

  return metaForStep(defaultStepFromCallStage(ctx.callStage));
}

/** True when prospect signals booking / decision — trigger “Close now”. */
export function shouldAutoClose(ctx: ClosingFlowContext): { close: boolean; reason?: string } {
  const last = (ctx.lastProspectInput ?? "").trim();
  if (!last) return { close: false };
  const psych = detectClientPsychology(last, ctx.transcriptSnippet);
  if (psych.stage === "ready_to_decide") {
    return { close: true, reason: "Buyer language indicates readiness — land time + invite." };
  }
  if (READY.test(last)) {
    return { close: true, reason: "Explicit momentum — confirm calendar now." };
  }
  return { close: false };
}

/**
 * Heuristic control score: question-led + short asks = higher control (guiding, not explaining).
 */
export function computeControlLevel(lastRepSample?: string): number {
  const t = (lastRepSample ?? "").trim();
  if (!t) return 52;
  let score = 48;
  if (/\?/.test(t)) score += 22;
  if (/\b(three minutes|quick|two things|fair question)\b/i.test(t)) score += 12;
  if (/\b(let me explain|basically|so what we do is)\b/i.test(t)) score -= 14;
  if (t.split(/\s+/).length > 55) score -= 12;
  return Math.min(96, Math.max(18, score));
}

export function advanceStepHint(current: ClosingFlowStep): ClosingFlowStep | null {
  const i = stepIndex(current);
  if (i < 0 || i >= CLOSING_STEP_ORDER.length - 1) return null;
  return CLOSING_STEP_ORDER[i + 1]!;
}
