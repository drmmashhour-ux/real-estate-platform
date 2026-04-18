/**
 * Read-only control plane for governance + learning — never throws.
 */

import type { GrowthGovernanceDecision } from "./growth-governance.types";
import type { GrowthLearningSummary, GrowthLearningWeights } from "./growth-learning.types";
import {
  GGL_HIGH_RISK_GOVERNANCE_LEVEL,
  GGL_MAX_EXECUTION_ERRORS,
  GGL_MAX_INSUFFICIENT_DATA_RATE,
  GGL_MAX_NEGATIVE_RATE,
  GGL_MAX_WEIGHT_DRIFT,
  GGL_MIN_SIGNALS_REQUIRED,
} from "./growth-governance-learning.constants";
import type { GrowthLearningControlDecision, GrowthLearningControlReason } from "./growth-governance-learning.types";

function maxWeightDrift(w: GrowthLearningWeights): number {
  const vals = [
    w.impactWeight,
    w.confidenceWeight,
    w.signalStrengthWeight,
    w.recencyWeight,
    w.governancePenaltyWeight,
    w.defaultBiasWeight,
  ];
  let m = 0;
  for (const v of vals) {
    m = Math.max(m, Math.abs(v - 1));
  }
  return m;
}

function governanceRiskLevel(g: GrowthGovernanceDecision | null | undefined): "low" | "medium" | "high" {
  if (!g) return "low";
  if (g.status === "human_review_required" || g.status === "freeze_recommended") {
    return GGL_HIGH_RISK_GOVERNANCE_LEVEL;
  }
  if (g.topRisks.some((r) => r.severity === "high")) {
    return GGL_HIGH_RISK_GOVERNANCE_LEVEL;
  }
  if (g.status === "caution" || g.status === "watch") return "medium";
  return "low";
}

export type GrowthLearningControlInput = {
  summary: GrowthLearningSummary;
  insufficientDataCount: number;
  totalOutcomes: number;
  weights: GrowthLearningWeights;
  governanceDecision: GrowthGovernanceDecision | null;
  executionFailedCount: number;
};

/**
 * Deterministic control state for gating adaptive weight updates and surfacing human review hints.
 * Precedence: reset_recommended > freeze_recommended > monitor > normal.
 */
export function computeGrowthLearningControlDecision(input: GrowthLearningControlInput): GrowthLearningControlDecision {
  try {
    const reasons: GrowthLearningControlReason[] = [];
    const recommendedActions: string[] = [];
    const createdAt = new Date().toISOString();

    const n = Math.max(1, input.totalOutcomes);
    const insufficientDataRate = input.insufficientDataCount / n;
    const negativeRate = input.summary.negativeRate;
    const weightDrift = maxWeightDrift(input.weights);
    const govRisk = governanceRiskLevel(input.governanceDecision);
    const executionErrors = input.executionFailedCount;

    const observedSignals: GrowthLearningControlDecision["observedSignals"] = {
      negativeRate,
      insufficientDataRate,
      weightDrift,
      governanceRisk: govRisk,
      executionErrors,
    };

    let state: GrowthLearningControlDecision["state"] = "normal";

    if (weightDrift >= GGL_MAX_WEIGHT_DRIFT) {
      reasons.push({
        code: "weight_drift_cap",
        message: `Local weight drift ${weightDrift.toFixed(3)} reached cap (${GGL_MAX_WEIGHT_DRIFT}).`,
      });
      recommendedActions.push("Revert to default weights after human review.");
      recommendedActions.push("Review recent weight change log in learning panel.");
      state = "reset_recommended";
    }

    if (state !== "reset_recommended") {
      if (negativeRate >= GGL_MAX_NEGATIVE_RATE) {
        reasons.push({
          code: "high_negative_rate",
          message: `Negative outcome rate ${(negativeRate * 100).toFixed(0)}% exceeds ${GGL_MAX_NEGATIVE_RATE * 100}%.`,
        });
        recommendedActions.push("Investigate negative outcomes in CRM and funnel data.");
        recommendedActions.push("Pause adaptive learning until causes are understood.");
        state = "freeze_recommended";
      } else if (insufficientDataRate >= GGL_MAX_INSUFFICIENT_DATA_RATE) {
        reasons.push({
          code: "high_insufficient_data",
          message: `Insufficient-data share ${(insufficientDataRate * 100).toFixed(0)}% is above ${GGL_MAX_INSUFFICIENT_DATA_RATE * 100}%.`,
        });
        recommendedActions.push("Improve telemetry completeness before trusting adaptation.");
        recommendedActions.push("Pause adaptive learning weight updates.");
        state = "freeze_recommended";
      } else if (govRisk === GGL_HIGH_RISK_GOVERNANCE_LEVEL) {
        reasons.push({
          code: "governance_high_risk",
          message: "Governance signals human review or freeze — do not amplify local drift.",
        });
        recommendedActions.push("Resolve governance review items before adjusting weights.");
        state = "freeze_recommended";
      } else if (executionErrors > GGL_MAX_EXECUTION_ERRORS) {
        reasons.push({
          code: "autopilot_execution_failures",
          message: `Execution failures (${executionErrors}) exceed ${GGL_MAX_EXECUTION_ERRORS}.`,
        });
        recommendedActions.push("Inspect controlled execution logs before adaptive learning continues.");
        state = "freeze_recommended";
      }
    }

    if (state === "normal") {
      if (input.summary.signalsEvaluated < GGL_MIN_SIGNALS_REQUIRED) {
        reasons.push({
          code: "low_signal_count",
          message: `Evaluated signals (${input.summary.signalsEvaluated}) < minimum (${GGL_MIN_SIGNALS_REQUIRED}).`,
        });
        recommendedActions.push("Gather more learning cycles before trusting adaptive shifts.");
        state = "monitor";
      } else if (insufficientDataRate >= 0.3) {
        reasons.push({
          code: "moderate_insufficient_data",
          message: `Insufficient-data share ${(insufficientDataRate * 100).toFixed(0)}% is moderately elevated.`,
        });
        recommendedActions.push("Monitor learning outputs closely; consider pausing if trend worsens.");
        state = "monitor";
      } else if (input.summary.warnings.some((w) => w.includes("low_evidence"))) {
        reasons.push({
          code: "weak_evidence",
          message: "Evaluator flagged low evidence — supervision recommended.",
        });
        recommendedActions.push("Keep adaptive weights under operator supervision.");
        state = "monitor";
      }
    }

    if (reasons.length === 0) {
      reasons.push({
        code: "all_clear",
        message: "Observed signals within conservative advisory bounds.",
      });
    }

    const confidence = Math.min(
      0.95,
      0.35 + Math.min(1, input.summary.signalsEvaluated / 15) * 0.45 + (state === "normal" ? 0.2 : 0),
    );

    return {
      state,
      reasons,
      confidence,
      recommendedActions: [...new Set(recommendedActions)],
      observedSignals,
      createdAt,
    };
  } catch {
    return {
      state: "monitor",
      reasons: [{ code: "eval_degraded", message: "Control evaluation degraded — defaulting to monitor." }],
      confidence: 0.2,
      recommendedActions: ["Retry learning cycle after telemetry availability improves."],
      observedSignals: {},
      createdAt: new Date().toISOString(),
    };
  }
}
