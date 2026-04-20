import type { CapitalAllocationDecision } from "../types/autonomy.types";

import { logAutonomy } from "../lib/autonomy-log";

export interface PortfolioBuildingCandidate {
  id: string;
  riskScore: number;
  expectedYieldScore: number;
  maintenanceUrgencyScore: number;
  occupancyScore?: number;
}

/** Ranked advisory allocations — execution always requires explicit human approval (portfolio policy). */
export function allocatePortfolioCapital(
  buildings: PortfolioBuildingCandidate[],
  availableBudget: number,
): CapitalAllocationDecision[] {
  logAutonomy("[autonomy:portfolio:allocate]", {
    candidates: buildings.length,
    budget: availableBudget,
  });

  const ranked = [...buildings].sort((a, b) => {
    const aScore =
      a.expectedYieldScore * 0.45 +
      (100 - a.riskScore) * 0.35 +
      a.maintenanceUrgencyScore * 0.2;

    const bScore =
      b.expectedYieldScore * 0.45 +
      (100 - b.riskScore) * 0.35 +
      b.maintenanceUrgencyScore * 0.2;

    return bScore - aScore;
  });

  let remaining = availableBudget;
  const decisions: CapitalAllocationDecision[] = [];

  for (const building of ranked) {
    if (remaining <= 0) break;

    const recommendedInvestment = Math.min(
      remaining,
      Math.max(10000, Math.round((building.expectedYieldScore / 100) * 50000)),
    );

    decisions.push({
      buildingId: building.id,
      recommendedInvestment,
      expectedReturnScore: building.expectedYieldScore,
      riskScore: building.riskScore,
      rationale: [
        `Expected yield score: ${building.expectedYieldScore}`,
        `Risk score: ${building.riskScore}`,
        `Maintenance urgency: ${building.maintenanceUrgencyScore}`,
      ],
    });

    remaining -= recommendedInvestment;
  }

  return decisions;
}
