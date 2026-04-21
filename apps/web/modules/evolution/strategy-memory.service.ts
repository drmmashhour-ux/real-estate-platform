import { prisma } from "@/lib/db";
import type { EvolutionDomain } from "./evolution.types";
import { computeNextReinforcementScore, bucketOutcome } from "./reinforcement.engine";
import type { FeedbackAssessment } from "./evolution.types";
import { logEvolution } from "./evolution-logger";

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
