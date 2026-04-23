import { getNextLine } from "@/modules/call-assistant/call-assistant.service";
import type { CallAssistantContext } from "@/modules/call-assistant/call-assistant.types";

import type { PersonaProfile, TrainingFeedbackResult } from "./call-center.types";

const FILLERS = /\b(um+|uh+|like|you know)\b/gi;
const CLAIMS = /\b(guarantee|promise|always|never fails|million|100%)\b/i;

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function scoreLength(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words < 5) return 45;
  if (words < 15) return 72;
  if (words < 45) return 88;
  return 70;
}

/**
 * Deterministic coaching scores — transparent rules (no generative invention of facts).
 */
export function scoreTrainingReply(
  userReply: string,
  persona: PersonaProfile,
  ctx: Pick<CallAssistantContext, "stage" | "discoveryIndex">,
): TrainingFeedbackResult {
  const text = userReply.trim();
  const clarityBase = scoreLength(text);
  const fillerPenalty = (text.match(FILLERS) ?? []).length * 6;
  const clarityScore = clamp(clarityBase - fillerPenalty, 35, 95);

  const questionBoost = /\?/.test(text) ? 8 : 0;
  const structureBoost = /\b(because|so that|two things|first|second)\b/i.test(text) ? 6 : 0;
  const confidenceScore = clamp(58 + questionBoost + structureBoost - (CLAIMS.test(text) ? 25 : 0), 30, 96);

  const controlScore = clamp(
    55 +
      (/\b(if it helps|fair|quick|respect your time|option)\b/i.test(text) ? 18 : 0) -
      (/!{2,}/.test(text) ? 12 : 0),
    28,
    96,
  );

  const overallScore = Math.round((clarityScore + confidenceScore + controlScore) / 3);

  const strengths: string[] = [];
  if (clarityScore >= 75) strengths.push("Clear, readable structure.");
  if (confidenceScore >= 75) strengths.push("Sounds grounded — avoids absolute claims.");
  if (controlScore >= 75) strengths.push("Professional tone with space for the prospect.");

  const improvements: string[] = [];
  if (fillerPenalty > 0) improvements.push("Reduce filler words — pause instead.");
  if (CLAIMS.test(text)) improvements.push("Swap superlatives for facts you can show live.");
  if (text.length < 25) improvements.push("Add one concrete question or proof ask.");

  const scriptCtx = {
    audience: persona.audience,
    contactName: undefined,
    region: undefined,
    performanceTier: "average" as const,
    previousInteraction: "none" as const,
  };

  const ideal = getNextLine({
    audience: persona.audience,
    scriptCategory: persona.scriptCategory,
    stage: ctx.stage,
    discoveryIndex: ctx.discoveryIndex,
    lastProspectInput: undefined,
    scriptContext: scriptCtx,
  });

  const betterVersion =
    ideal.suggested.length > 0 && ideal.suggested !== text ? ideal.suggested : undefined;

  if (improvements.length === 0 && betterVersion) {
    improvements.push("Compare your line with the approved script alternative below.");
  }

  return {
    overallScore,
    clarityScore,
    confidenceScore,
    controlScore,
    strengths: strengths.length > 0 ? strengths : ["Keep practicing — consistency beats perfection."],
    improvements: improvements.length > 0 ? improvements : ["Tighten the ask — one proof + one next step."],
    betterVersion,
  };
}
