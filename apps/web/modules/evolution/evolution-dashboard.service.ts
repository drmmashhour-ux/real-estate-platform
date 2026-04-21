import { prisma } from "@/lib/db";
import type { EvolutionDomain } from "./evolution.types";
import { EVOLUTION_ENGINE_VERSION } from "./evolution.types";
import { listStrategyMemory } from "./strategy-memory.service";
import { listExperiments } from "./experiment.service";

export async function buildEvolutionDashboardSnapshot(domain?: EvolutionDomain) {
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  const [outcomeCount, recentOutcomes, strategies, experiments, pendingAdjustments] = await Promise.all([
    prisma.evolutionOutcomeEvent.count({
      where: {
        ...(domain ? { domain } : {}),
        createdAt: { gte: since },
      },
    }),
    prisma.evolutionOutcomeEvent.findMany({
      where: {
        ...(domain ? { domain } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        domain: true,
        metricType: true,
        strategyKey: true,
        experimentKey: true,
        varianceScore: true,
        createdAt: true,
      },
    }),
    listStrategyMemory(domain, 40),
    listExperiments(domain),
    prisma.evolutionPolicyAdjustment.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const improvementHint =
    strategies.length === 0 ?
      "No strategy memory yet — emit outcomes from bookings, conversions, and pricing reviews."
    : `Top reinforced strategies available — scores are bounded ${EVOLUTION_ENGINE_VERSION}.`;

  return {
    engineVersion: EVOLUTION_ENGINE_VERSION,
    windowDays: 30,
    outcomeEventsLast30d: outcomeCount,
    recentOutcomes,
    strategyMemory: strategies,
    experiments,
    pendingAdjustments,
    improvementHint,
  };
}
