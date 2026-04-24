import { CeoContext, CeoInsight, CeoSeverity } from "./ceo.types";
import { v4 as uuidv4 } from "uuid";

export class CeoInsightEngine {
  static generateCeoInsights(context: CeoContext): CeoInsight[] {
    const insights: CeoInsight[] = [];

    // 1. Growth Insights
    if (context.growth.trend < -0.1) {
      insights.push({
        id: uuidv4(),
        type: "GROWTH",
        title: "Significant Drop in Lead Volume",
        description: `Lead volume has decreased by ${(Math.abs(context.growth.trend) * 100).toFixed(1)}% over the last 30 days.`,
        severity: "high",
        detectedAt: new Date(),
      });
    } else if (context.growth.trend > 0.2) {
      insights.push({
        id: uuidv4(),
        type: "GROWTH",
        title: "Strong Growth in Lead Inbound",
        description: `Lead volume is up by ${(context.growth.trend * 100).toFixed(1)}%. Consider scaling operations.`,
        severity: "low",
        detectedAt: new Date(),
      });
    }

    // 2. Deal Efficiency Insights
    if (context.deals.avgRejectionRate > 0.3) {
      insights.push({
        id: uuidv4(),
        type: "EFFICIENCY",
        title: "High Deal Rejection Rate",
        description: `Rejection rate is at ${(context.deals.avgRejectionRate * 100).toFixed(1)}%. Review deal sourcing quality.`,
        severity: "medium",
        detectedAt: new Date(),
      });
    }

    if (context.deals.closeRate < 0.05 && context.deals.volume > 20) {
      insights.push({
        id: uuidv4(),
        type: "EFFICIENCY",
        title: "Low Deal Conversion",
        description: `Only ${(context.deals.closeRate * 100).toFixed(1)}% of deals are closing. Evaluate the conversion funnel.`,
        severity: "high",
        detectedAt: new Date(),
      });
    }

    // 3. ESG Insights
    if (context.esg.adoptionRate < 0.15) {
      insights.push({
        id: uuidv4(),
        type: "OPPORTUNITY",
        title: "Low ESG Upgrade Adoption",
        description: `Only ${(context.esg.adoptionRate * 100).toFixed(1)}% of properties have active ESG upgrades. High potential for green promotion.`,
        severity: "medium",
        detectedAt: new Date(),
      });
    }

    // 4. Risk / Strategy Insights
    if (context.agents.successSignals < 0.8 && context.agents.decisionsCount > 10) {
      insights.push({
        id: uuidv4(),
        type: "RISK",
        title: "Declining Agent Reliability",
        description: `Agent success rate has dropped to ${(context.agents.successSignals * 100).toFixed(1)}%. Potential strategy drift.`,
        severity: "high",
        detectedAt: new Date(),
      });
    }

    if (context.rollout.activeCount < 3) {
      insights.push({
        id: uuidv4(),
        type: "OPPORTUNITY",
        title: "Low Market Expansion Activity",
        description: "Few active city rollouts detected. System is stable enough for higher expansion intensity.",
        severity: "low",
        detectedAt: new Date(),
      });
    }

    return insights;
  }
}
