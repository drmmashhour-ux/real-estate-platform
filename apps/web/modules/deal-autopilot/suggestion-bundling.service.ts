import type { BrokerActionQueueItem, NextBestAction } from "./deal-autopilot.types";

export function bundleActions(actions: NextBestAction[]): BrokerActionQueueItem[] {
  const urgent = actions.filter((a) => a.urgency === "high" || a.urgency === "critical");
  const bundleId = urgent.length >= 2 ? `bundle_${Date.now()}` : undefined;
  return actions.map((a) => ({
    ...a,
    bundleId: urgent.includes(a) ? bundleId : undefined,
  }));
}
