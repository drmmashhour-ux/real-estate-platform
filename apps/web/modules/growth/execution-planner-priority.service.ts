/**
 * Conservative priority tiers + human-readable rationale — deterministic; no ROI claims.
 */

import type {
  ExecutionTaskPriority,
  PlannerConfidence,
} from "@/modules/growth/execution-planner.types";

export type PriorityInput = {
  allocationScore?: number;
  allocationConfidence?: PlannerConfidence;
  weeklyBundleConfidence?: PlannerConfidence;
  weeklyUrgent?: boolean;
  aiConfidence01?: number;
  dominationPhase?: number;
  /** Mission Control top action — treated as immediate operator attention. */
  missionControlTop?: boolean;
  /** When true, rank is capped as exploratory. */
  flywheelLowConfidence?: boolean;
};

export type PriorityWithRationale = {
  priority: ExecutionTaskPriority;
  rationale: string;
};

export function aiConfidenceToPlanner(conf: number): PlannerConfidence {
  if (conf >= 0.72) return "high";
  if (conf >= 0.52) return "medium";
  return "low";
}

export function computeTaskPriority(input: PriorityInput): ExecutionTaskPriority {
  return computeTaskPriorityWithRationale(input).priority;
}

/** Exact prioritization rules with stable rationale strings. */
export function computeTaskPriorityWithRationale(input: PriorityInput): PriorityWithRationale {
  if (input.missionControlTop) {
    return {
      priority: "high",
      rationale:
        "Mission Control surfaced this as a top navigation item — verify the destination panel before wider team work.",
    };
  }

  if (input.flywheelLowConfidence) {
    return {
      priority: "low",
      rationale: "Flywheel historical confidence is low — ranking is triage-only until samples improve.",
    };
  }

  const urgentWeekly =
    input.weeklyUrgent === true &&
    (input.weeklyBundleConfidence === "high" || input.weeklyBundleConfidence === "medium");

  const strongAllocation =
    input.allocationScore != null &&
    input.allocationScore >= 72 &&
    input.allocationConfidence === "high";

  const solidAllocation =
    input.allocationScore != null &&
    input.allocationScore >= 58 &&
    input.allocationConfidence !== "low";

  const strongAi =
    input.aiConfidence01 != null && input.aiConfidence01 >= 0.72 && input.weeklyBundleConfidence !== "low";

  const weakBundle = input.weeklyBundleConfidence === "low";

  if (weakBundle && !strongAllocation && !urgentWeekly) {
    return {
      priority: "low",
      rationale: "Weekly bundle confidence is low and no overriding strong allocation signal is present.",
    };
  }

  if (strongAllocation || urgentWeekly || strongAi) {
    const bits: string[] = [];
    if (strongAllocation) bits.push("strong capital allocation score + confidence");
    if (urgentWeekly) bits.push("weekly priority lane with acceptable bundle confidence");
    if (strongAi) bits.push("high-confidence deterministic AI assist suggestion");
    return {
      priority: "high",
      rationale: `High tier: ${bits.join("; ")}.`,
    };
  }

  if (
    solidAllocation ||
    (input.aiConfidence01 != null && input.aiConfidence01 >= 0.55) ||
    input.dominationPhase === 0 ||
    urgentWeekly
  ) {
    return {
      priority: "medium",
      rationale:
        "Medium tier — supporting allocation/AI signals, domination near-term milestone, or weekly follow-through.",
    };
  }

  return {
    priority: "low",
    rationale: "Low tier — exploratory validation, weaker signals, or deferrable sequencing.",
  };
}

export function effortFromPriority(p: ExecutionTaskPriority): "low" | "medium" | "high" {
  if (p === "high") return "high";
  if (p === "medium") return "medium";
  return "low";
}
