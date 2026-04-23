import { prisma } from "@/lib/db";
import { CeoDecisionProposal } from "./ceo-ai.types";
import { aiCeoLog } from "../ai-ceo/ai-ceo-log";
import { logActivity } from "@/lib/audit/activity-log";

/**
 * PHASE 7: LONG-TERM STRATEGY MEMORY
 * Manages strategic goals that span multiple months.
 * Influences short-term decision making by providing a "north star".
 */

/**
 * Creates a new long-term strategic goal.
 */
export async function createLongTermGoal(params: {
  name: string;
  domain: string;
  description?: string;
  targetMetric: string;
  targetValue: number;
  priority?: number;
}) {
  const goal = await prisma.ceoLongTermGoal.create({
    data: {
      name: params.name,
      domain: params.domain,
      description: params.description,
      targetMetric: params.targetMetric,
      targetValue: params.targetValue,
      priority: params.priority ?? 0,
      currentValue: 0,
      active: true,
    }
  });

  aiCeoLog("info", "long_term_goal_created", { goalId: goal.id, name: goal.name });
  void logActivity({
    action: "long_term_goal_updated",
    entityType: "CeoLongTermGoal",
    entityId: goal.id,
    metadata: { name: goal.name, targetValue: goal.targetValue }
  });

  return goal;
}

/**
 * Updates the current value/progress of a long-term goal.
 */
export async function updateLongTermGoalProgress(goalId: string, newValue: number) {
  const goal = await prisma.ceoLongTermGoal.update({
    where: { id: goalId },
    data: { currentValue: newValue, updatedAt: new Date() }
  });

  aiCeoLog("info", "long_term_goal_updated", { goalId, newValue });
  
  return goal;
}

/**
 * Evaluates how well proposed decisions align with active long-term goals.
 * Returns adjustment signals for the decision engine.
 */
export async function evaluateGoalAlignment(proposals: CeoDecisionProposal[]) {
  const activeGoals = await prisma.ceoLongTermGoal.findMany({
    where: { active: true },
    orderBy: { priority: "desc" }
  });

  if (activeGoals.length === 0) return [];

  return proposals.map(p => {
    const matchingGoals = activeGoals.filter(g => g.domain === p.domain);
    
    // Calculate alignment (simplified heuristic)
    // In a real system, we'd use LLM or specific metric mapping
    let alignmentScore = matchingGoals.length > 0 ? 0.1 * matchingGoals.length : 0;
    
    return {
      title: p.title,
      alignmentScore: Math.min(0.3, alignmentScore),
      goalNames: matchingGoals.map(g => g.name),
    };
  });
}

/**
 * Seed some initial goals if none exist.
 */
export async function seedInitialGoals() {
  const count = await prisma.ceoLongTermGoal.count();
  if (count > 0) return;

  await createLongTermGoal({
    name: "Broker Network Expansion",
    domain: "GROWTH",
    description: "Grow the active broker base to support market liquidity.",
    targetMetric: "active_brokers",
    targetValue: 500,
    priority: 10,
  });

  await createLongTermGoal({
    name: "Revenue Diversification",
    domain: "PRICING",
    description: "Shift dependency from leads to featured placement and SaaS tiers.",
    targetMetric: "saas_revenue_pct",
    targetValue: 0.4,
    priority: 8,
  });
}
