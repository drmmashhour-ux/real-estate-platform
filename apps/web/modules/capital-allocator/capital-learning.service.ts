import { prisma } from "@/lib/db";
import { updateAllocationWeights } from "./capital-allocation-weights.service";

/** 
 * Tracks real performance after an allocation plan is executed.
 * In V2, performanceDelta is the % change in gross revenue or occupancy.
 */
export async function trackAllocationPerformance(args: {
  listingId: string;
  planId: string;
  performanceDelta: number;
  metricType: "revenue" | "occupancy" | "revpar";
}) {
  const { listingId, planId, performanceDelta, metricType } = args;

  // Log the performance delta for future learning
  await prisma.capitalAllocationLog.create({
    data: {
      listingId,
      planId,
      eventType: "PERFORMANCE_TRACK",
      message: `Performance delta (${metricType}) after allocation: ${performanceDelta}`,
      meta: { performanceDelta, metricType },
    },
  });

  // Learning logic: If performance was good, increase scoring weights
  if (performanceDelta > 0.1) {
    // Increment uplift weight as it seems to be a good predictor
    await updateAllocationWeights({ upliftWeight: 14 }); // Simple heuristic for V2
  } else if (performanceDelta < -0.05) {
    // Increase risk penalty if underperforming
    await updateAllocationWeights({ riskPenalty: 30 });
  }
}

export async function getStrategySuccessRate(strategy: string): Promise<number> {
  const logs = await prisma.capitalAllocationLog.findMany({
    where: {
      eventType: "PERFORMANCE_TRACK",
    },
  });

  if (logs.length === 0) return 0.5; // Baseline

  const successful = logs.filter((l) => (l.meta as any)?.performanceDelta > 0).length;
  return successful / logs.length;
}
