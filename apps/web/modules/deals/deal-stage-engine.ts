import { logInfo } from "@/lib/logger";
import type { PipelineStage } from "@/modules/deals/deal.types";
import { PIPELINE_STAGES, TERMINAL_STAGES } from "@/modules/deals/deal-policy";

const TAG = "[deal-stage]";

export type StageGateContext = {
  hasListing: boolean;
  hasMemo: boolean;
  hasIcPack: boolean;
  hasCommitteeSubmission: boolean;
  /** True when IC review submission exists with status SUBMITTED/REVIEWING */
  hasActiveSubmission: boolean;
  criticalConditionsOpen: number;
};

const STAGE_ORDER: Record<PipelineStage, number> = PIPELINE_STAGES.reduce(
  (acc, s, i) => {
    acc[s as PipelineStage] = i;
    return acc;
  },
  {} as Record<PipelineStage, number>
);
STAGE_ORDER.DECLINED = 95;
STAGE_ORDER.ON_HOLD = 90;

export function assertStageTransitionAllowed(
  from: PipelineStage,
  to: PipelineStage,
  gate: StageGateContext
): { ok: boolean; reason?: string } {
  if (from === to) return { ok: true };

  if (TERMINAL_STAGES.includes(from) && to !== from) {
    return { ok: false, reason: `Cannot leave terminal stage ${from} without reopening record.` };
  }

  if (to === "SCREENING" && !gate.hasListing) {
    return { ok: false, reason: "SCREENING requires a linked listing / asset record." };
  }

  if (to === "PRELIMINARY_REVIEW" && !gate.hasMemo) {
    return { ok: false, reason: "PRELIMINARY_REVIEW requires an investor memo on file." };
  }

  if (to === "IC_PREP" && !gate.hasIcPack) {
    return { ok: false, reason: "IC_PREP requires an IC pack on file." };
  }

  if (to === "IC_REVIEW" && !gate.hasActiveSubmission && !gate.hasCommitteeSubmission) {
    return { ok: false, reason: "IC_REVIEW requires an active committee submission." };
  }

  if (to === "CONDITIONAL_APPROVAL") {
    return { ok: true }; // validated at decision time
  }

  if (to === "APPROVED" && gate.criticalConditionsOpen > 0) {
    return {
      ok: false,
      reason: `Cannot move to APPROVED with ${gate.criticalConditionsOpen} critical condition(s) still open.`,
    };
  }

  if (to === "DECLINED") {
    return { ok: true };
  }

  if (to === "ON_HOLD") {
    return { ok: true };
  }

  if (to === "EXECUTION") {
    const ok = from === "APPROVED" || from === "CONDITIONAL_APPROVAL";
    if (!ok) return { ok: false, reason: "EXECUTION follows approval paths only." };
  }

  return { ok: true };
}

export function logStageCheck(dealId: string, from: PipelineStage, to: PipelineStage, result: { ok: boolean; reason?: string }) {
  logInfo(`${TAG}`, { dealId, from, to, ...result });
}

export function stageRank(s: PipelineStage): number {
  return STAGE_ORDER[s] ?? 0;
}
