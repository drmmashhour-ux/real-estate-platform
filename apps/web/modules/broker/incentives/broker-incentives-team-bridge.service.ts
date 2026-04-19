/**
 * Read-only adapter: team coaching composes incentive summaries only when the incentives engine is on.
 * Performance scoring stays in `modules/broker/performance`; no circular imports with UI routes.
 */

import { brokerIncentivesFlags } from "@/config/feature-flags";
import { buildBrokerIncentiveSummary } from "./broker-incentives-summary.service";

export async function maybeBuildBrokerIncentiveSummaryForTeamView(
  brokerId: string,
  options?: { nowMs?: number },
) {
  if (!brokerIncentivesFlags.brokerIncentivesV1) return null;
  return buildBrokerIncentiveSummary(brokerId, { ...options, emitMonitoring: false });
}
