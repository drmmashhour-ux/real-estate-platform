import {
  RENOCLIMAT_CHECKLIST_ORDER,
  RENOCLIMAT_STEPS,
  RENOCLIMAT_STEP_COUNT,
  type RenoclimatChecklistKey,
} from "./renoclimat-steps";

export type RenoclimatAssistantEngineOutput = {
  currentStep: number;
  nextAction: string;
  instructions: string[];
  tips: string[];
  /** How many checklist gates are satisfied */
  completedCount: number;
  /** Whether every checklist item is checked */
  allComplete: boolean;
};

function normalizeChecklist(raw: unknown): Partial<Record<RenoclimatChecklistKey, boolean>> {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Partial<Record<RenoclimatChecklistKey, boolean>> = {};
  for (const key of RENOCLIMAT_CHECKLIST_ORDER) {
    const v = (raw as Record<string, unknown>)[key];
    if (typeof v === "boolean") out[key] = v;
  }
  return out;
}

/**
 * First checklist gate that is still false determines the active step (1–5).
 * When all gates are true, step stays at 5 with completion-oriented messaging.
 */
export function deriveCurrentStep(checklist: Partial<Record<RenoclimatChecklistKey, boolean>>): number {
  for (let i = 0; i < RENOCLIMAT_CHECKLIST_ORDER.length; i++) {
    const key = RENOCLIMAT_CHECKLIST_ORDER[i];
    if (!checklist[key]) return i + 1;
  }
  return RENOCLIMAT_STEP_COUNT;
}

export function countCompleted(checklist: Partial<Record<RenoclimatChecklistKey, boolean>>): number {
  return RENOCLIMAT_CHECKLIST_ORDER.filter((k) => checklist[k] === true).length;
}

export function runRenoclimatAssistant(args: {
  checklistJson?: unknown;
}): RenoclimatAssistantEngineOutput {
  const checklist = normalizeChecklist(args.checklistJson);
  const completedCount = countCompleted(checklist);
  const allComplete = completedCount === RENOCLIMAT_CHECKLIST_ORDER.length;
  const currentStep = deriveCurrentStep(checklist);
  const idx = Math.min(RENOCLIMAT_STEPS.length - 1, Math.max(0, currentStep - 1));
  const def = RENOCLIMAT_STEPS[idx];

  const nextAction = allComplete
    ? "Track your official correspondence and retain decision letters — LECIPM cannot view government files."
    : def.headline;

  return {
    currentStep,
    nextAction,
    instructions: allComplete
      ? [
          "Retain proof of submission and any requests for additional documents.",
          "Follow payment timelines described in official letters only.",
          "Use LECIPM tools for listing and contractor coordination — not for grant adjudication.",
        ]
      : def.instructions,
    tips: allComplete
      ? [
          "Documents: keep a single PDF bundle per property for audits and resale disclosure.",
          "Timing: appeals or corrections may have strict windows — watch program mail.",
          "Avoid: sharing sensitive claim numbers publicly on listings.",
        ]
      : def.tips,
    completedCount,
    allComplete,
  };
}
