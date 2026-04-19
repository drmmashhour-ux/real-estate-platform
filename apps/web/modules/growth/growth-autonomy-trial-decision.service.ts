/**
 * Final governance decision — advisory only; never activates expansion automatically.
 */

import type { GrowthAutonomyTrialDecision } from "./growth-autonomy-trial-results.types";
import type { GrowthAutonomyTrialSafetySignal } from "./growth-autonomy-trial-results.types";
import type { GrowthAutonomyTrialUsefulnessBand } from "./growth-autonomy-trial-results.types";

export function resolveGrowthAutonomyTrialDecision(args: {
  safety: GrowthAutonomyTrialSafetySignal;
  usefulness: GrowthAutonomyTrialUsefulnessBand;
  sparseData: boolean;
  sampleSize: number;
}): { decision: GrowthAutonomyTrialDecision; explanation: string; operatorLines: string[] } {
  if (args.safety.level === "unsafe") {
    return {
      decision: "rollback",
      explanation:
        "Safety signals crossed conservative thresholds — treat as rollback governance posture (no automatic enforcement here).",
      operatorLines: [
        "Unsafe or high-risk signals — prefer rollback review and do not treat outcomes as stable.",
        args.safety.reasons[0] ?? "See safety reasons in detail.",
      ],
    };
  }

  if (args.sparseData || args.usefulness === "insufficient_data") {
    return {
      decision: "insufficient_data",
      explanation:
        "Sparse feedback or audit volume — do not interpret usefulness; gather more deliberate operator signals.",
      operatorLines: [
        "Insufficient data to judge usefulness — continue observation or collect structured feedback.",
        "No expansion or broadening should follow from this outcome alone.",
      ],
    };
  }

  if (args.usefulness === "poor") {
    if (args.safety.level === "caution") {
      return {
        decision: "rollback",
        explanation: "Poor usefulness with caution-level safety — conservative rollback posture.",
        operatorLines: ["Weak signals plus caution flags — hold scope and consider rollback path."],
      };
    }
    return {
      decision: "hold",
      explanation: "Poor usefulness while still technically safe — hold internal scope.",
      operatorLines: ["Safe but not useful enough yet — keep internal-only and avoid widening."],
    };
  }

  if (args.usefulness === "weak") {
    return {
      decision: "hold",
      explanation: "Mixed usefulness — hold until signals strengthen.",
      operatorLines: ["Weak usefulness band — maintain narrow internal scope only."],
    };
  }

  if (args.usefulness === "good") {
    return {
      decision: "keep_internal",
      explanation: "Useful and stable enough to keep as an internal-only assistive signal.",
      operatorLines: ["Useful and stable internally — still no automatic expansion or new trial types."],
    };
  }

  /** strong */
  if (args.sampleSize >= 5 && args.safety.level === "safe") {
    return {
      decision: "eligible_for_future_review",
      explanation:
        "Strong usefulness with adequate sample and clean safety — eligible for future manual governance review only.",
      operatorLines: [
        "Eligible for future manual review — not an activation, not an expansion, not a second trial.",
        "Organization must explicitly decide any next step; this flag is governance metadata only.",
      ],
    };
  }

  return {
    decision: "keep_internal",
    explanation: "Strong signals but sample still thin for future-review tagging — keep internal.",
    operatorLines: ["Strong but sample below future-review threshold — keep internal-only."],
  };
}
