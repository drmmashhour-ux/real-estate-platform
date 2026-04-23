import type { CallStage } from "@/modules/call-assistant/call-assistant.types";

import type { ClosingFlowStep, ClosingStepMeta } from "./closing.types";

export const CLOSING_STEP_ORDER: ClosingFlowStep[] = [
  "hook",
  "value",
  "question",
  "align",
  "micro_close",
  "final_close",
];

const META: Record<ClosingFlowStep, Omit<ClosingStepMeta, "step" | "index">> = {
  hook: {
    title: "Hook",
    guidance: "Earn attention — few words, relevance, pace.",
  },
  value: {
    title: "Value (short)",
    guidance: "One sharp outcome — no feature dump.",
  },
  question: {
    title: "Question",
    guidance: "Whoever asks questions controls the conversation.",
  },
  align: {
    title: "Align",
    guidance: "Mirror their reality — agreement trap → lower resistance.",
  },
  micro_close: {
    title: "Micro-close",
    guidance: "Low-risk entry — quick look / three minutes / you decide after.",
  },
  final_close: {
    title: "Final close",
    guidance: "Binary or time-bound — today or tomorrow.",
  },
};

export function stepIndex(step: ClosingFlowStep): number {
  return CLOSING_STEP_ORDER.indexOf(step);
}

export function metaForStep(step: ClosingFlowStep): ClosingStepMeta {
  const index = stepIndex(step);
  return { step, index, ...META[step] };
}

/** Map CRM call stage to default closer step when no override. */
export function defaultStepFromCallStage(stage: CallStage): ClosingFlowStep {
  switch (stage) {
    case "opening":
      return "hook";
    case "pitch":
      return "value";
    case "discovery":
      return "question";
    case "objection":
      return "align";
    case "closing":
      return "final_close";
    default:
      return "hook";
  }
}
