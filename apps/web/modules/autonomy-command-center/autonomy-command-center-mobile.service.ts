import { buildAutonomyCommandCenterPayload } from "./autonomy-command-center.service";

/** Reduced payload for `/api/mobile/admin/autonomy-command-center/summary`. */
export async function buildMobileAutonomyCommandCenterSummary() {
  const full = await buildAutonomyCommandCenterPayload();
  return {
    generatedAt: full.generatedAt,
    advisory: full.advisory,
    systemOverview: full.systemOverview,
    alerts: full.alertsAndAnomalies.slice(0, 20),
    approvalsPending: full.approvalQueue.filter((a) => a.status === "PENDING").slice(0, 25),
    liveFeed: full.liveAutonomyFeed.slice(0, 15),
    controlsHint: full.controlsHint,
  };
}
