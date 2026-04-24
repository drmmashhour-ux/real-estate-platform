import { prisma } from "@/lib/db";
import { CeoDataAggregatorService } from "./ceo-data-aggregator.service";

export class CeoStrategySnapshotService {
  /**
   * Builds a complete strategic snapshot for the CEO dashboard.
   */
  static async buildCeoStrategySnapshot() {
    const context = await CeoDataAggregatorService.buildCeoContext();
    
    const [longTermGoals, topPatterns, avoidPatterns, recentDecisions] = await Promise.all([
      prisma.ceoLongTermGoal.findMany({ where: { active: true }, orderBy: { priority: "desc" } }),
      prisma.ceoStrategyPattern.findMany({ where: { score: { gt: 2 } }, orderBy: { score: "desc" }, take: 5 }),
      prisma.ceoStrategyPattern.findMany({ where: { score: { lt: -2 } }, orderBy: { score: "asc" }, take: 5 }),
      prisma.ceoDecisionMemory.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { outcomes: true } }),
    ]);

    return {
      context,
      longTermGoals,
      topPatterns,
      avoidPatterns,
      recentDecisions,
      timestamp: new Date(),
    };
  }
}
