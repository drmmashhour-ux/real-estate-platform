/** Manual pipeline — statuses stored on `OutreachLead.status` (no auto progression). */
export const PIPELINE_STAGES = [
  "identified",
  "contacted",
  "interested",
  "onboarded",
  "first_booking",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export function isValidPipelineTransition(from: string, to: string): boolean {
  const i = PIPELINE_STAGES.indexOf(from as PipelineStage);
  const j = PIPELINE_STAGES.indexOf(to as PipelineStage);
  if (i < 0 || j < 0) return false;
  return j === i || j === i + 1;
}
