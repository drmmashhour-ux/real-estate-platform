import type { EsgActionDraft } from "./esg-action.types";
import type { RoiEstimate } from "./esg-action-roi.engine";

export type PriorityContext = {
  missingEnergyData: boolean;
  lowDataCoverage: boolean;
  lowEvidenceConfidence: boolean;
  acquisitionBlockerWeight: number;
  documentConflictSignals: number;
  unverifiedCertClaim: boolean;
};

export type PrioritizedDraft = EsgActionDraft & {
  priorityScore: number;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
};

function priorityLabelFromScore(score: number): "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" {
  if (score >= 85) return "CRITICAL";
  if (score >= 70) return "HIGH";
  if (score >= 45) return "MEDIUM";
  return "LOW";
}

/**
 * Priority score — deterministic weights; subtract dependency/cost penalties in generator pass.
 */
export function prioritizeAction(
  draft: EsgActionDraft,
  roi: RoiEstimate,
  ctx: PriorityContext
): PrioritizedDraft {
  let riskUrgency = 40;
  let scoreUplift = Math.min(35, roi.estimatedScoreImpact * 1.2);
  let confidenceGap = Math.min(40, roi.estimatedConfidenceImpact * 0.9);
  let investorReadiness = Math.min(25, roi.estimatedConfidenceImpact * 0.5);

  if (draft.reasonCode === "EVIDENCE_UTILITY_BILL" || draft.reasonCode === "EVIDENCE_BASELINE_ENERGY") {
    riskUrgency = 95;
  }
  if (draft.reasonCode.includes("DOC_CONFLICT") || draft.reasonCode.includes("ADDRESS_MISMATCH")) {
    riskUrgency = Math.max(riskUrgency, 88);
  }
  if (ctx.unverifiedCertClaim && draft.category === "CERTIFICATION") {
    riskUrgency = Math.max(riskUrgency, 82);
  }
  if (draft.reasonCode.includes("CLIMATE_RISK_PLAN") || draft.reasonCode.includes("DECARB_ROADMAP")) {
    riskUrgency = Math.max(riskUrgency, 72);
  }

  if (ctx.missingEnergyData && draft.category === "ENERGY") {
    scoreUplift *= 0.85;
  }

  let penalty = 0;
  if (draft.dependenciesJson && typeof draft.dependenciesJson === "object") penalty += 8;
  if (roi.estimatedCostBand === "HIGH" && draft.actionType === "QUICK_WIN") penalty += 25;

  let raw =
    riskUrgency * 0.35 +
    scoreUplift * 0.22 +
    confidenceGap * 0.18 +
    investorReadiness * 0.12 +
    ctx.acquisitionBlockerWeight * 0.08 +
    Math.min(15, ctx.documentConflictSignals * 5) -
    penalty;

  const clamped = Math.max(0, Math.min(100, raw));

  return {
    ...draft,
    priorityScore: Math.round(clamped * 10) / 10,
    priority: priorityLabelFromScore(clamped),
  };
}

/** Reduce priority when similar quick wins exist — called after batch pass */
export function applyQuickWinCostPenalty(actions: PrioritizedDraft[]): PrioritizedDraft[] {
  const quickHigh = actions.filter((a) => a.actionType === "QUICK_WIN" && a.priorityScore >= 70).length;
  return actions.map((a) => {
    if (a.actionType !== "CAPEX" || quickHigh < 2) return a;
    const adj = Math.max(0, a.priorityScore - 6);
    return {
      ...a,
      priorityScore: adj,
      priority: priorityLabelFromScore(adj),
    };
  });
}
