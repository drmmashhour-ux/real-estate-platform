import { CeoContext, CeoInsight } from "./ceo.types";
import { v4 as uuidv4 } from "uuid";

/**
 * PHASE 3: INSIGHT ENGINE
 * Analyzes the context to detect strategic problems or opportunities.
 */
export function generateCeoInsights(context: CeoContext): CeoInsight[] {
  const insights: CeoInsight[] = [];

  // 1. Growth Insights
  if (context.growth.conversionRate < 0.05) {
    insights.push({
      id: uuidv4(),
      type: "GROWTH",
      title: "Conversion rate critical",
      description: `Current conversion rate is ${(context.growth.conversionRate * 100).toFixed(1)}%, which is below the 5% threshold.`,
      severity: "high",
      detectedAt: new Date(),
    });
  }
  if (context.growth.leads < context.growth.leadsPrev * 0.8) {
    insights.push({
      id: uuidv4(),
      type: "GROWTH",
      title: "Significant lead volume drop",
      description: `Leads dropped by more than 20% compared to previous period (${context.growth.leads} vs ${context.growth.leadsPrev}).`,
      severity: "medium",
      detectedAt: new Date(),
    });
  }

  // 2. Deal Insights
  if (context.deals.closeRate < 0.1 && context.deals.volume > 5) {
    insights.push({
      id: uuidv4(),
      type: "DEALS" as any, // Mapped to EFFICIENCY in generic type
      title: "Low deal close rate",
      description: `Deal close rate is ${(context.deals.closeRate * 100).toFixed(1)}%. Possible friction in the pipeline.`,
      severity: "medium",
      detectedAt: new Date(),
    });
  }

  // 3. ESG Insights
  if (context.esg.upgradeActivity < 5) {
    insights.push({
      id: uuidv4(),
      type: "OPPORTUNITY",
      title: "Low ESG upgrade adoption",
      description: "Only a few ESG upgrades detected recently. Strategic opportunity to promote sustainable listings.",
      severity: "low",
      detectedAt: new Date(),
    });
  }

  // 4. Rollout Risk
  if (context.rollout.successRate < 0.6 && context.rollout.activeRollouts > 0) {
    insights.push({
      id: uuidv4(),
      type: "RISK",
      title: "High rollout failure rate",
      description: `Only ${(context.rollout.successRate * 100).toFixed(0)}% of rollouts are succeeding. Re-evaluate experimentation risk.`,
      severity: "high",
      detectedAt: new Date(),
    });
  }

  // 5. Revenue / Scale
  if (context.revenue && context.revenue.growth > 0.1) {
    insights.push({
      id: uuidv4(),
      type: "REVENUE",
      title: "Strong revenue growth",
      description: `MRR growth is at ${(context.revenue.growth * 100).toFixed(1)}%. Scale operations to maintain momentum.`,
      severity: "medium",
      detectedAt: new Date(),
    });
  }

  return insights;
}
