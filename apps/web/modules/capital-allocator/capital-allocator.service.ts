/**
 * BNHub AI Capital Allocator — deterministic portfolio budget recommendation engine.
 * Recommendation-first; execution/spend happens only via explicit approval workflows (future).
 */

import { loadAllocationMetricsForScope } from "./capital-metrics-loader.service";
import { buildAllocationCandidate } from "./capital-priority-score.service";
import { allocateBudgetAcrossCandidates } from "./capital-budget-engine.service";

export async function generateCapitalAllocationPlan(params: {
  scopeType: string;
  scopeId: string;
  totalBudget: number;
  reservePct?: number;
}) {
  const metrics = await loadAllocationMetricsForScope(params.scopeType, params.scopeId);
  const candidates = metrics.map(buildAllocationCandidate);

  return allocateBudgetAcrossCandidates({
    totalBudget: params.totalBudget,
    reservePct: params.reservePct,
    candidates,
  });
}
