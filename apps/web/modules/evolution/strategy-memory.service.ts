import { prisma } from "@/lib/db";
import type { EvolutionDomain } from "./evolution.types";
import { computeNextReinforcementScore, bucketOutcome } from "./reinforcement.engine";
import type { FeedbackAssessment } from "./evolution.types";
import { logEvolution } from "./evolution-logger";
import { proposePolicyAdjustment } from "./policy-adjustment";

/** Persist bounded reinforcement score + counts for a strategy key. */
export async function applyReinforcementToMemory(args: {
  domain: EvolutionDomain;
  strategyKey: string;
  assessment: FeedbackAssessment;
  signalWeight?: number;
}): Promise<{ reinforcementScore: number; successCount: number; failureCount: number }> {
  const existing = await prisma.evolutionStrategyMemory.findUnique({
    where: {
      domain_strategyKey: { domain: args.domain, strategyKey: args.strategyKey },
    },
  });

  const current = existing?.reinforcementScore ?? 0.5;
  const { next } = computeNextReinforcementScore(current, {
    domain: args.domain,
    strategyKey: args.strategyKey,
    assessment: args.assessment,
    signalWeight: args.signalWeight,
  });

  const { success, failure } = bucketOutcome(args.assessment);

  const row = await prisma.evolutionStrategyMemory.upsert({
    where: {
      domain_strategyKey: { domain: args.domain, strategyKey: args.strategyKey },
    },
    create: {
      domain: args.domain,
      strategyKey: args.strategyKey,
      reinforcementScore: next,
      successCount: success,
      failureCount: failure,
      lastOutcomeAt: new Date(),
      calibrationJson: {},
    },
    update: {
      reinforcementScore: next,
      successCount: { increment: success },
      failureCount: { increment: failure },
      lastOutcomeAt: new Date(),
    },
  });

  logEvolution("strategy_applied", {
    domain: args.domain,
    strategyKey: args.strategyKey,
    reinforcementScore: row.reinforcementScore,
  });

  // Phase 8: Optional Policy Proposals for repeated negative outcomes
  if (args.assessment === "WORSE_THAN_EXPECTED" && row.failureCount > 3 && row.reinforcementScore < 0.3) {
    try {
      await proposePolicyAdjustment({
        domain: args.domain,
        kind: "RANKING_WEIGHT",
        payloadJson: { strategyKey: args.strategyKey, currentScore: row.reinforcementScore },
        rationale: `Automatic negative outcome threshold reached for ${args.strategyKey} (${row.failureCount} failures). Proposing review.`,
      });
      logEvolution("adjustment", { phase: "proposal_triggered", strategyKey: args.strategyKey });
    } catch (e) {
      // Don't block core reinforcement
    }
  }

  return {
    reinforcementScore: row.reinforcementScore,
    successCount: row.successCount,
    failureCount: row.failureCount,
  };
}

export async function listStrategyMemory(domain?: EvolutionDomain, take = 80) {
  return prisma.evolutionStrategyMemory.findMany({
    ...(domain ? { where: { domain } } : {}),
    orderBy: [{ reinforcementScore: "desc" }],
    take,
  });
}
