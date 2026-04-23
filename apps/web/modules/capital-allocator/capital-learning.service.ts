import { prisma } from "@/lib/db";
import { logComplianceEvent } from "@/services/compliance/coownershipCompliance.service";

export async function trackAllocationPerformance(listingId: string, planId: string, performanceDelta: number) {
  // Log the performance delta for future learning
  await prisma.capitalAllocationLog.create({
    data: {
      listingId,
      planId,
      eventType: "PERFORMANCE_TRACK",
      message: `Performance delta after allocation: ${performanceDelta}`,
      meta: { performanceDelta },
    },
  });

  // Learning logic: If performance was good, increase scoring weights for this listing/strategy
  if (performanceDelta > 0.1) {
    // Increment success in autonomy weights or similar storage
    // For V2, we'll just log it. Actual weight adjustment would happen in capital-priority-score.service
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
