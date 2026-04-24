import { prisma } from "@/lib/db";
import { CeoDecision } from "./ceo.types";

export class CeoLongTermGoalsService {
  /**
   * Creates a new long-term goal.
   */
  static async createLongTermGoal(params: {
    name: string;
    domain: string;
    description?: string;
    targetMetric: string;
    targetValue: number;
    priority: number;
  }) {
    return await prisma.ceoLongTermGoal.create({
      data: {
        name: params.name,
        domain: params.domain,
        description: params.description,
        targetMetric: params.targetMetric,
        targetValue: params.targetValue,
        priority: params.priority,
        active: true,
      },
    });
  }

  /**
   * Updates progress for active goals.
   */
  static async updateLongTermGoalProgress(metrics: Record<string, any>) {
    const activeGoals = await prisma.ceoLongTermGoal.findMany({
      where: { active: true },
    });

    for (const goal of activeGoals) {
      if (metrics[goal.targetMetric] !== undefined) {
        await prisma.ceoLongTermGoal.update({
          where: { id: goal.id },
          data: { currentValue: metrics[goal.targetMetric] },
        });
      }
    }
  }

  /**
   * Evaluates if proposed decisions align with long-term goals.
   */
  static async evaluateGoalAlignment(decisions: CeoDecision[]): Promise<{ decisionId: string; alignmentScore: number; goalNames: string[] }[]> {
    const activeGoals = await prisma.ceoLongTermGoal.findMany({
      where: { active: true },
    });

    return decisions.map(decision => {
      const relevantGoals = activeGoals.filter(g => g.domain === decision.domain);
      let alignmentScore = 0;
      const goalNames: string[] = [];

      for (const goal of relevantGoals) {
        // Simple alignment check: if goal is BROKER_GROWTH and domain is MARKETING, it's a match
        // In a real system, we'd use semantic similarity or more complex rules.
        alignmentScore += 0.2 * goal.priority;
        goalNames.push(goal.name);
      }

      return {
        decisionId: decision.id,
        alignmentScore: Math.min(1, alignmentScore),
        goalNames,
      };
    });
  }
}
