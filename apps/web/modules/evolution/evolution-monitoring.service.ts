import { prisma } from "@/lib/db";
import { EVOLUTION_ENGINE_VERSION } from "./evolution.types";

/** Internal calibration / ops snapshot — safe for admin consoles. */
export async function getEvolutionMonitoringSnapshot() {
  const [runs30d, experimentsByStatus, pendingAdj, outcomesByMetric] = await Promise.all([
    prisma.evolutionOutcomeEvent.count({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
    }),
    prisma.evolutionSafeExperiment.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.evolutionPolicyAdjustment.count({ where: { status: "PENDING" } }),
    prisma.evolutionOutcomeEvent.groupBy({
      by: ["metricType"],
      _count: true,
      where: { createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
    }),
  ]);

  return {
    engineVersion: EVOLUTION_ENGINE_VERSION,
    outcomesLast30d: runs30d,
    experimentsByStatus,
    pendingPolicyAdjustments: pendingAdj,
    outcomesByMetricType: outcomesByMetric,
    notes:
      "Autonomous policy application is disabled by design — approvals required for live weight changes.",
  };
}
