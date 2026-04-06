/**
 * Reactivation / booking reminders — delegate to existing conversion + growth queues.
 * Prefer `GrowthEmailQueue` / `runFollowUpAutomation` triggered from payment and CRM rules.
 */
import { prisma } from "@/lib/db";

export async function queueGrowthReactivationTouch(userId: string, reason: string): Promise<void> {
  await prisma.growthFunnelEvent
    .create({
      data: {
        eventName: "growth:reactivation_queued",
        userId,
        properties: { reason, v: 1 },
      },
    })
    .catch(() => {});
}
