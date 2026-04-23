import type { AllocationPlanResult, AllocationPlanLine } from "./capital-allocator.types";
import { allocateBudgetAcrossCandidates } from "./capital-budget-engine.service";

export type ScenarioInput = {
  additionalBudget: number;
  reallocationStrategy: "aggressive" | "conservative" | "balanced";
};

export type ScenarioResult = {
  projectedImpact: number;
  projectedRiskChange: number;
  bestAllocationStrategy: AllocationPlanResult;
};

export function simulateCapitalScenario(
  currentPlan: AllocationPlanResult,
  input: ScenarioInput
): ScenarioResult {
  const newTotalBudget = currentPlan.totalBudget + input.additionalBudget;
  
  // Adjust candidates based on strategy
  const adjustedCandidates = currentPlan.items.map((item) => {
    let multiplier = 1;
    if (input.reallocationStrategy === "aggressive") {
      multiplier = item.expectedImpactScore > 0.7 ? 1.5 : 0.8;
    } else if (input.reallocationStrategy === "conservative") {
      multiplier = item.metrics.operationalRiskScore && item.metrics.operationalRiskScore > 0.5 ? 0.5 : 1.1;
    }
    
    return {
      ...item,
      recommendedAmount: item.recommendedAmount * multiplier,
    };
  });

  const simulatedPlan = allocateBudgetAcrossCandidates({
    totalBudget: newTotalBudget,
    reservePct: 0.1, // Default reserve
    candidates: adjustedCandidates,
  });

  // Calculate projected impact (simplified logic)
  const projectedImpact = simulatedPlan.items.reduce(
    (sum, item) => sum + item.allocatedAmount * item.expectedImpactScore,
    0
  );

  const projectedRiskChange = simulatedPlan.items.reduce(
    (sum, item) => sum + (item.metrics.operationalRiskScore ?? 0) * (item.allocatedAmount / newTotalBudget),
    0
  );

  return {
    projectedImpact,
    projectedRiskChange,
    bestAllocationStrategy: simulatedPlan,
  };
}
