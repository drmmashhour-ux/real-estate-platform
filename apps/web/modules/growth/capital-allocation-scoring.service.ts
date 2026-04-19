/**
 * Conservative 0–100 priority — high weight on execution strength + growth potential.
 */

export type AllocationPriorityInput = {
  performanceScore?: number;
  growthPotential?: number;
  /** 0–1 blend of derived rates. */
  executionStrength?: number;
  /** 0–1 normalized distance from leads target (larger = more gap to close). */
  scaleGapLeads?: number;
  /** 0–1 competitive pressure (broker density / activity). */
  competitionPressure?: number;
  dataTier: "low" | "medium" | "high";
};

export type AllocationPriorityResult = {
  priorityScore: number;
  confidence: "low" | "medium" | "high";
  warnings: string[];
};

function dataFactor(t: AllocationPriorityInput["dataTier"]): number {
  if (t === "high") return 1;
  if (t === "medium") return 0.88;
  return 0.7;
}

/**
 * Weight caps: executionStrength 32, growthPotential 32, scaleGap 16, competition 12 — renormalized by available channels.
 */
export function computeAllocationPriority(input: AllocationPriorityInput): AllocationPriorityResult {
  const warnings: string[] = [];
  let pts = 0;
  let max = 0;

  if (input.executionStrength != null) {
    pts += 32 * Math.min(1, Math.max(0, input.executionStrength));
    max += 32;
  } else {
    warnings.push("Execution strength partially undefined — rate blend missing.");
  }

  if (input.growthPotential != null) {
    pts += 32 * Math.min(1, Math.max(0, input.growthPotential));
    max += 32;
  } else {
    warnings.push("Growth potential unavailable — expansion signals missing.");
  }

  if (input.scaleGapLeads != null) {
    pts += 16 * Math.min(1, Math.max(0, input.scaleGapLeads));
    max += 16;
  }

  if (input.competitionPressure != null) {
    pts += 12 * Math.min(1, Math.max(0, input.competitionPressure));
    max += 12;
  }

  let base = max > 0 ? (pts / max) * 100 : 35;
  base *= dataFactor(input.dataTier);

  if (max < 48) warnings.push("Few comparable signal channels — score discounted.");

  let score = Math.round(Math.min(100, Math.max(15, base)));

  let confidence: AllocationPriorityResult["confidence"] = "low";
  if (input.dataTier === "high" && max >= 56) confidence = "high";
  else if (input.dataTier !== "low" && max >= 40) confidence = "medium";

  if (input.dataTier === "low") {
    score = Math.round(score * 0.82);
    warnings.push("Low data tier — treat priority as exploratory.");
  }

  return { priorityScore: score, confidence, warnings };
}
