import { prisma } from "@/lib/db";
import { logAgent } from "./agent-logger";

/**
 * Competition Engine: Compare agent performance and resolve wins/losses.
 */
export async function resolveAgentCompetition(domain: string) {
  // @ts-ignore
  const agents = await prisma.aiAgent.findMany({
    where: { domain, status: "ACTIVE" },
    include: { strategies: true },
  });

  if (agents.length < 2) return null;

  // Heuristic: Compare agents based on strategy success rates
  const ranked = agents.map((agent: any) => {
    const totalWins = agent.strategies.reduce((acc: number, s: any) => acc + s.successCount, 0);
    const totalLosses = agent.strategies.reduce((acc: number, s: any) => acc + s.failureCount, 0);
    const total = totalWins + totalLosses;
    const winRate = total > 0 ? totalWins / total : 0.5;

    return {
      agentId: agent.id,
      name: agent.name,
      winRate,
      strategies: agent.strategies.length,
    };
  }).sort((a, b) => b.winRate - a.winRate);

  const winner = ranked[0];
  const loser = ranked[ranked.length - 1];

  logAgent("competition_resolved", {
    domain,
    winner: winner.name,
    winnerRate: winner.winRate,
    loser: loser.name,
    loserRate: loser.winRate,
  });

  return { ranked, winner, loser };
}

/**
 * Promote high-performing agents and reduce exposure for weak ones.
 */
export async function updateAgentExposure(domain: string) {
  const result = await resolveAgentCompetition(domain);
  if (!result) return;

  const { ranked } = result;

  for (let i = 0; i < ranked.length; i++) {
    const r = ranked[i];
    const performanceScore = r.winRate;

    // @ts-ignore
    await prisma.aiAgent.update({
      where: { id: r.agentId },
      data: { performanceScore },
    });

    logAgent("agent_performance", {
      agentId: r.agentId,
      name: r.name,
      score: performanceScore,
    });
  }
}
