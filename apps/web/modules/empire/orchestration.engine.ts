import { getEmpireStrategicRecommendations } from "./strategic-allocation.engine";
import { EmpireOrchestrationPriority } from "./empire.types";

/**
 * Coordinate:
 * - which company gets capital
 * - which company gets hiring priority
 * - which company gets founder attention
 * - which company is next for expansion
 */
export async function getEmpireOrchestrationPriorities(): Promise<EmpireOrchestrationPriority[]> {
  const strategy = await getEmpireStrategicRecommendations();
  
  // Logic: Map strategic needs to operational priorities.
  // Founder attention is allocated to both CRITICAL and STRONG entities.
  // Hiring priority follows high-growth entities.

  const priorities: EmpireOrchestrationPriority[] = [];

  strategy.forEach((s, idx) => {
    if (s.action === "INCREASE_CAPITAL") {
      priorities.push({
        entityId: s.entityId,
        entityName: s.entityName,
        priorityType: "CAPITAL",
        rank: idx + 1,
        rationale: "Scaling high-performer.",
        tradeoffs: "Reduces available reserves for other ventures.",
      });
      priorities.push({
        entityId: s.entityId,
        entityName: s.entityName,
        priorityType: "HIRING",
        rank: idx + 2,
        rationale: "Growth requires talent expansion.",
        tradeoffs: "Hiring overhead may slow down execution temporarily.",
      });
    }

    if (s.action === "SHUT_DOWN" || s.action === "PAUSE") {
      priorities.push({
        entityId: s.entityId,
        entityName: s.entityName,
        priorityType: "ATTENTION",
        rank: 1,
        rationale: "Immediate founder attention required for winding down or pivoting.",
        tradeoffs: "Takes attention away from growth-stage companies.",
      });
    }
  });

  return priorities.sort((a, b) => a.rank - b.rank);
}
