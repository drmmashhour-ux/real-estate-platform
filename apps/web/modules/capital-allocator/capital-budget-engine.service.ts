import type { AllocationCandidate, AllocationPlanResult, AllocationPlanLine } from "./capital-allocator.types";

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

type Weighted = AllocationCandidate & { compositeWeight: number };

export function allocateBudgetAcrossCandidates(params: {
  totalBudget: number;
  reservePct?: number;
  candidates: AllocationCandidate[];
}): AllocationPlanResult {
  const reservePct = params.reservePct ?? 0.1;
  const reserveBudget = round2(params.totalBudget * reservePct);
  const allocatableBudget = round2(params.totalBudget - reserveBudget);

  const eligible = params.candidates.filter((c) => c.allocationType !== "reduce").filter((c) => c.recommendedAmount > 0);

  const weighted: Weighted[] = eligible.map((candidate) => {
    const compositeWeight =
      candidate.priorityScore * 0.45 + candidate.expectedImpactScore * 0.35 + candidate.confidenceScore * 100 * 0.2;

    return {
      ...candidate,
      compositeWeight,
    };
  });

  const totalWeight = weighted.reduce((sum, item) => sum + item.compositeWeight, 0);

  const scaled: AllocationPlanLine[] = weighted.map((item) => {
    const proportionalBudget =
      totalWeight > 0 ? (allocatableBudget * item.compositeWeight) / totalWeight : 0;

    const allocatedAmount = round2(Math.min(item.recommendedAmount, proportionalBudget));

    const { compositeWeight: _cw, ...rest } = item;
    return {
      ...rest,
      recommendedAmount: round2(item.recommendedAmount),
      allocatedAmount,
    };
  });

  const reduced: AllocationPlanLine[] = params.candidates
    .filter((c) => c.allocationType === "reduce")
    .map((c) => ({
      ...c,
      allocatedAmount: 0,
      recommendedAmount: round2(c.recommendedAmount),
    }));

  const finalItems = [...scaled, ...reduced].sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
    return b.expectedImpactScore - a.expectedImpactScore;
  });

  return {
    totalBudget: round2(params.totalBudget),
    allocatableBudget,
    reserveBudget,
    items: finalItems,
  };
}
