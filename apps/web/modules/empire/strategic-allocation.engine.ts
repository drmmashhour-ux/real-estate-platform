import { summarizeEmpirePerformance } from "./performance-aggregation.service";
import { StrategicRecommendation } from "./empire.types";
import { logEmpire } from "./empire-logger";

const TAG = "[empire-strategy]";

/**
 * Recommends:
 * - increase capital to high-performing venture
 * - reduce spend in underperforming venture
 * - hold reserves
 * - incubate new entity
 * - shut down or pause weak initiative
 */
export async function getEmpireStrategicRecommendations(): Promise<StrategicRecommendation[]> {
  const perf = await summarizeEmpirePerformance();
  const recommendations: StrategicRecommendation[] = [];

  for (const entity of perf.scorecards) {
    if (entity.status === "STRONG" && entity.growth > 0.2) {
      recommendations.push({
        entityId: entity.entityId,
        entityName: entity.name,
        action: "INCREASE_CAPITAL",
        priority: 10,
        rationale: "Entity showing strong growth and revenue. Recommend aggressive capital injection to capture market share.",
        confidence: 0.9,
        riskNotes: "High burn-to-growth ratio possible if scaling is inefficient.",
      });
    }

    if (entity.status === "CRITICAL") {
      recommendations.push({
        entityId: entity.entityId,
        entityName: entity.name,
        action: "SHUT_DOWN",
        priority: 9,
        rationale: "Critical status with high burn and low revenue. Survival improbable without pivot.",
        confidence: 0.8,
        riskNotes: "Intellectual property salvage possible.",
      });
    }

    if (entity.type === "HOLDING" && entity.status === "STABLE") {
      recommendations.push({
        entityId: entity.entityId,
        entityName: entity.name,
        action: "HOLD_RESERVES",
        priority: 5,
        rationale: "Holding entity is stable. Maintain reserves for opportunistic acquisitions.",
        confidence: 0.7,
        riskNotes: "Opportunity cost if capital stays idle for too long.",
      });
    }
  }

  logEmpire("strategic_allocation_recommended", { count: recommendations.length });

  return recommendations.sort((a, b) => b.priority - a.priority);
}
