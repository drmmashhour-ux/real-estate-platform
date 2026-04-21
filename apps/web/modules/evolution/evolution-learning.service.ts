import type { EvolutionDomain } from "./evolution.types";
import { recordEvolutionOutcome, type RecordOutcomeArgs } from "./outcome-tracker.service";
import { proposePolicyAdjustment } from "./policy-adjustment";
import { logEvolution } from "./evolution-logger";

/**
 * Conservative learning orchestration: outcome → reinforcement (inside recordEvolutionOutcome)
 * → optional bounded policy proposal when memory indicates sustained drift.
 * Does **not** auto-apply production weights.
 */
export async function processOutcomeWithLearning(
  args: RecordOutcomeArgs & { proposeRankingTweak?: boolean }
): Promise<{ outcomeId: string; proposalId?: string }> {
  const { proposeRankingTweak, ...rest } = args;
  const r = await recordEvolutionOutcome(rest);

  let proposalId: string | undefined;
  if (proposeRankingTweak && rest.strategyKey && rest.domain) {
    const mem = r.feedback.assessment;
    if (mem === "WORSE_THAN_EXPECTED") {
      const p = await proposePolicyAdjustment({
        domain: rest.domain as EvolutionDomain,
        kind: "RANKING_WEIGHT",
        payloadJson: { strategyKey: rest.strategyKey, delta: -0.03 },
        rationale: "Sustained underperformance vs expectation — propose small negative weight delta (requires approval).",
      });
      proposalId = p.id;
      logEvolution("adjustment", { phase: "proposal_suggested", proposalId });
    }
  }

  return { outcomeId: r.id, proposalId };
}
