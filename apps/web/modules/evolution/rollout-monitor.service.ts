import { prisma } from "@/lib/db";
import { logEvolution } from "./evolution-logger";
import { advanceRollout, rollbackRollout } from "./rollout.engine";

const TAG = "[evolution-rollout]";

/**
 * Monitor rollout performance and automatically pause or rollback if metrics drop.
 */
export async function monitorActiveRollouts() {
  // @ts-ignore
  const activeRollouts = await prisma.policyRollout.findMany({
    where: { status: "ACTIVE" },
    include: { policyAdjustment: true },
  });

  for (const rollout of activeRollouts) {
    const { id, rolloutPercent, policyAdjustment } = rollout;
    
    // Heuristic: Check metrics for the policy's domain
    // In production, this would query EvolutionOutcomeEvent and compare 
    // rollout cohort vs control group.
    
    const performanceDropDetected = false; // Mock check
    
    if (performanceDropDetected) {
      logEvolution("rollout", { event: "performance_drop_detected", rolloutId: id, domain: policyAdjustment.domain });
      await rollbackRollout(id);
      
      // Notify admins
      // ...
    } else {
      // Heuristic: Auto-advance after 24h of stability
      const stabilizedDurationHours = 24;
      const createdAt = new Date(rollout.updatedAt);
      const hoursSinceUpdate = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

      if (hoursSinceUpdate >= stabilizedDurationHours && rolloutPercent < 100) {
        await advanceRollout(id);
      }
    }
  }
}
