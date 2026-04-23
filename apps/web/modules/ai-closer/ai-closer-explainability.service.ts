import type { AiCloserExplanation } from "./ai-closer.types";

export function buildCloserExplanation(input: {
  stage: AiCloserStage;
  stageReasons: string[];
  objection: AiCloserObjectionKey;
  objectionSignals: string[];
  mainLineRationale: string;
  shouldBook: boolean;
  softBook: boolean;
  shouldEscalate: boolean;
  escalateWhy: string;
  confidenceSignals: string[];
}): AiCloserExplanation {
  return {
    detectedStage: input.stage,
    stageReasons: input.stageReasons,
    detectedObjection: input.objection,
    objectionSignals: input.objectionSignals,
    whyThisLine: input.mainLineRationale,
    bookingRecommendation: input.shouldBook ? "yes" : input.softBook ? "soft" : "no",
    bookingReason: input.shouldBook
      ? "Signals indicate readiness for a concrete calendar step; suggest binary time choice."
      : input.softBook
        ? "Interest present but friction remains — propose low-commitment visit window, not pressure."
        : "Premature booking would feel pushy given objection or stage — stay diagnostic first.",
    escalationRecommendation: input.shouldEscalate ? "yes" : "no",
    escalationReason: input.shouldEscalate ? input.escalateWhy : "AI confidence sufficient for assist lines; licensed human optional.",
    confidenceBasis: input.confidenceSignals,
    complianceNote:
      "LECIPM assistant suggestions are non-binding hints for reps; no legal, tax, or financing advice. User-facing copy must identify automation where required.",
  };
}
