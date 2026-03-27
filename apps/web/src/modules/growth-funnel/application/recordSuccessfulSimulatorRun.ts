import { trackGrowthFunnelEvent } from "@/src/modules/growth-funnel/application/trackGrowthFunnelEvent";
import {
  getOrCreateUsageCounter,
  incrementSimulatorRuns,
  markActivationCompleted,
} from "@/src/modules/growth-funnel/infrastructure/growthFunnelRepository";

export async function recordSuccessfulSimulatorRun(args: {
  userId: string;
  propertyId: string;
  source: string;
}): Promise<void> {
  const before = await getOrCreateUsageCounter(args.userId);
  await incrementSimulatorRuns(args.userId);
  await trackGrowthFunnelEvent({
    userId: args.userId,
    eventName: "simulator_used",
    properties: { propertyId: args.propertyId, source: args.source },
  });
  if (before.simulatorRuns === 0) {
    await trackGrowthFunnelEvent({
      userId: args.userId,
      eventName: "first_action_completed",
      properties: { propertyId: args.propertyId, source: args.source },
    });
    await markActivationCompleted(args.userId);
  }
}
