import type { LiveFeedbackResult } from "@/modules/live-training/live-training.types";

export type ScenarioDimensionScores = {
  clarity: number;
  control: number;
  conciseness: number;
  closing: number;
  composite: number;
};

/** Structured scoring — complements raw feedback.score */
export function scoreScenarioTurn(
  feedback: LiveFeedbackResult,
  wordCount: number,
): ScenarioDimensionScores {
  let clarity = 72;
  if (feedback.tags.includes("unclear_value")) clarity -= 18;
  if (feedback.tags.includes("good_framing")) clarity += 10;
  if (wordCount > 0 && wordCount < 8) clarity -= 6;
  clarity = Math.min(98, Math.max(20, clarity));

  let control = 65;
  if (feedback.tags.includes("asks_question")) control += 16;
  if (feedback.tags.includes("no_control")) control -= 20;
  if (feedback.tags.includes("good_framing")) control += 6;
  control = Math.min(98, Math.max(15, control));

  let conciseness = 75;
  if (feedback.tags.includes("too_long")) conciseness -= 22;
  if (wordCount > 0 && wordCount <= 45) conciseness += 8;
  if (wordCount > 55) conciseness -= 10;
  conciseness = Math.min(98, Math.max(18, conciseness));

  let closing = 68;
  if (feedback.tags.includes("strong_close")) closing += 20;
  if (feedback.tags.includes("weak_close")) closing -= 18;
  closing = Math.min(98, Math.max(15, closing));

  const composite = Math.round((clarity + control + conciseness + closing) / 4);
  return { clarity, control, conciseness, closing, composite };
}
