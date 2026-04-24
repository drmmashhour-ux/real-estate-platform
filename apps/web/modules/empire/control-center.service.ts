import { prisma } from "@/lib/db";
import { summarizeCapitalBuckets } from "./capital-control.service";
import { summarizeEmpirePerformance } from "./performance-aggregation.service";
import { getEmpireStrategicRecommendations } from "./strategic-allocation.engine";
import { getEmpireOrchestrationPriorities } from "./orchestration.engine";
import { checkEmpireGovernance } from "./governance.service";

/**
 * Central Control Center aggregator for the Empire Dashboard.
 */
export async function getEmpireControlDashboardData() {
  // @ts-ignore
  const entities = await prisma.empireEntity.findMany({
    include: {
      ownershipsAsChild: { include: { parentEntity: true } },
      roles: true,
    },
  });

  // @ts-ignore
  const ownerships = await prisma.empireOwnership.findMany({
    include: {
      parentEntity: true,
      childEntity: true,
    },
  });

  const [capital, performance, strategy, orchestration, governance] = await Promise.all([
    summarizeCapitalBuckets(),
    summarizeEmpirePerformance(),
    getEmpireStrategicRecommendations(),
    getEmpireOrchestrationPriorities(),
    checkEmpireGovernance(),
  ]);

  return {
    empireOverview: {
      totalEntities: entities.length,
      activeEntities: entities.filter((e: any) => e.isActive).length,
      totalRevenueRollup: performance.groupSummary.totalRevenue,
      totalCapitalRollup: capital.reduce((acc, c) => acc + c.totalCapital, 0),
    },
    entities,
    ownershipGraph: ownerships,
    capitalSummary: capital,
    performanceSummary: performance,
    strategicAlerts: governance.alerts,
    strategicRecommendations: strategy,
    orchestrationPriorities: orchestration,
  };
}
