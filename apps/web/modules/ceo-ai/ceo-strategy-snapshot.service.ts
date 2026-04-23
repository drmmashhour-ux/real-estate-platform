import { prisma } from "@/lib/db";

/**
 * PHASE 8: CEO STRATEGY SNAPSHOT
 * Aggregates the AI CEO's long-term goals, strategic learning, and recent outcomes.
 * Used to power the CEO Dashboard's strategic insights.
 */

/**
 * Builds a comprehensive view of the current CEO strategic state.
 */
export async function buildCeoStrategySnapshot() {
  const [
    goals,
    topPatterns,
    bottomPatterns,
    recentDecisions,
    summaryStats
  ] = await Promise.all([
    // Active goals
    prisma.ceoLongTermGoal.findMany({ 
      where: { active: true }, 
      orderBy: { priority: "desc" } 
    }),
    
    // Most successful patterns
    prisma.ceoStrategyPattern.findMany({ 
      where: { score: { gt: 0 } },
      orderBy: { score: "desc" }, 
      take: 5 
    }),
    
    // Least successful patterns
    prisma.ceoStrategyPattern.findMany({ 
      where: { score: { lt: 0 } },
      orderBy: { score: "asc" }, 
      take: 5 
    }),
    
    // Recent strategic audit trail
    prisma.ceoDecisionMemory.findMany({
      include: { outcomes: true },
      orderBy: { createdAt: "desc" },
      take: 10
    }),

    // High level stats
    prisma.ceoDecisionOutcome.aggregate({
      _avg: { impactScore: true },
      _count: { id: true },
    })
  ]);

  // Summarize domain performance
  const domainPerformance = await prisma.ceoStrategyPattern.groupBy({
    by: ['domain'],
    _avg: { score: true },
    _sum: { timesUsed: true },
  });

  return {
    longTermGoals: goals,
    topStrategyPatterns: topPatterns,
    riskyStrategyPatterns: bottomPatterns,
    recentStrategicMemory: recentDecisions,
    stats: {
      totalDecisionsEvaluated: summaryStats._count.id,
      averageImpactScore: summaryStats._avg.impactScore,
      domainPerformance,
    },
    generatedAt: new Date().toISOString()
  };
}
