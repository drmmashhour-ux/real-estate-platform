import type { BrokerActionQueueItem, NextBestAction } from "./deal-autopilot.types";
import { bundleActions } from "./suggestion-bundling.service";
import { rankNextBestActions } from "./suggestion-ranking.service";

export function buildBrokerActionQueue(actions: NextBestAction[], max = 12): BrokerActionQueueItem[] {
  const ranked = rankNextBestActions(actions);
  return bundleActions(ranked.slice(0, max));
}
