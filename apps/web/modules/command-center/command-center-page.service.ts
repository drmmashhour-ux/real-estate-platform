import type { PlatformRole } from "@prisma/client";

import type { CommandCenterPagePayload } from "./command-center.types";
import { isExecutiveCommandCenter } from "./command-center.types";
import { loadCommandCenterAlerts } from "./command-center-alerts.service";
import { loadCommandCenterFeed } from "./command-center-feed.service";
import { mapCommandCenterFeedToIntelligence } from "./command-center-intelligence-feed.service";
import { loadCommandCenterSignalsPayload } from "./command-center-signal.service";
import { loadCommandCenterSummary } from "./command-center-summary.service";
import { loadSystemPerformanceSection } from "./command-center-system-performance.service";

export async function loadCommandCenterPagePayload(
  userId: string,
  role: PlatformRole,
): Promise<CommandCenterPagePayload> {
  const [summary, feed, alerts, systemPerformance] = await Promise.all([
    loadCommandCenterSummary(userId, role),
    loadCommandCenterFeed(userId, role),
    loadCommandCenterAlerts(userId, role),
    isExecutiveCommandCenter(role) ? loadSystemPerformanceSection() : Promise.resolve(null),
  ]);

  const signalsPayload = await loadCommandCenterSignalsPayload(summary, role);
  const intelligenceFeed = mapCommandCenterFeedToIntelligence(feed, role);

  return {
    summary,
    feed,
    intelligenceFeed,
    alerts,
    signals: signalsPayload.signals,
    signalsPrimary: signalsPayload.signalsPrimary,
    signalsByZone: signalsPayload.zones,
    marketplaceHealth: signalsPayload.marketplaceHealth,
    strategicRecommendations: signalsPayload.strategicRecommendations,
    systemPerformance: isExecutiveCommandCenter(role) ? systemPerformance : null,
    role,
    viewMode: isExecutiveCommandCenter(role) ? "executive" : "broker",
    generatedAt: new Date().toISOString(),
  };
}
