/**
 * Structured rubric: communication, speed, clarity, closing (each 0–10).
 * Maps to stored columns: salesSkillScore = closing, executionScore = avg(speed, clarity).
 */
export type RubricInput = {
  communication: number;
  speed: number;
  clarity: number;
  closing: number;
};

function clamp10(n: number): number {
  return Math.max(0, Math.min(10, Math.round(n)));
}

export function computeEvaluationScores(input: RubricInput): {
  communicationScore: number;
  speedScore: number;
  clarityScore: number;
  closingScore: number;
  salesSkillScore: number;
  executionScore: number;
  overallScore: number;
} {
  const communicationScore = clamp10(input.communication);
  const speedScore = clamp10(input.speed);
  const clarityScore = clamp10(input.clarity);
  const closingScore = clamp10(input.closing);
  const salesSkillScore = closingScore;
  const executionScore = Math.round((speedScore + clarityScore) / 2);
  const overallScore =
    (communicationScore + speedScore + clarityScore + closingScore) / 4;

  return {
    communicationScore,
    speedScore,
    clarityScore,
    closingScore,
    salesSkillScore,
    executionScore,
    overallScore,
  };
}
