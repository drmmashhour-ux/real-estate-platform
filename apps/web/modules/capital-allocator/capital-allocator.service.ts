/**
 * BNHub AI Capital Allocator — deterministic portfolio budget recommendation engine.
 * Recommendation-first; execution/spend happens only via explicit approval workflows (future).
 */

import { loadAllocationMetricsForScope } from "./capital-metrics-loader.service";
import { buildAllocationCandidate } from "./capital-priority-score.service";
import { allocateBudgetAcrossCandidates } from "./capital-budget-engine.service";
import { getAllocationWeights } from "./capital-allocation-weights.service";

export async function generateCapitalAllocationPlan(params: {
  scopeType: string;
  scopeId: string;
  totalBudget: number;
  reservePct?: number;
}) {
  const [metrics, weights] = await Promise.all([
    loadAllocationMetricsForScope(params.scopeType, params.scopeId),
    getAllocationWeights(),
  ]);

  const candidates = metrics.map((m) => buildAllocationCandidate(m, weights));

  return allocateBudgetAcrossCandidates({
    totalBudget: params.totalBudget,
    reservePct: params.reservePct,
    candidates,
  });
}
