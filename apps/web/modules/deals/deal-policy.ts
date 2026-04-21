import type { PipelineStage } from "@/modules/deals/deal.types";

/** Ordered progression hint — not all transitions are linear */
export const PIPELINE_STAGES: PipelineStage[] = [
  "SOURCED",
  "SCREENING",
  "PRELIMINARY_REVIEW",
  "IC_PREP",
  "IC_REVIEW",
  "CONDITIONAL_APPROVAL",
  "APPROVED",
  "EXECUTION",
  "CLOSED",
];

export const TERMINAL_STAGES: PipelineStage[] = ["CLOSED", "DECLINED"];

/** Committee member proxy: ADMIN + BROKER (extend via env for dedicated committee users). */
export function committeeActorRoles(): Set<string> {
  return new Set(["ADMIN", "BROKER"]);
}
