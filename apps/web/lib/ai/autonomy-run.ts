import { isDemoMode } from "@/lib/demo/isDemoMode";
import { detectAnomalies, type ListingSignals } from "./anomaly";
import { recordAiActionAudit } from "./action-audit.service";
import { sendAlert } from "./alerts";
import {
  type ExecuteContext,
  type ExecuteResult,
  type AutonomousAction,
  executeActions,
} from "./executor";
import { getListingSignalsForAutopilot } from "./listings-for-autopilot";
import { mergeAutonomyActions } from "./merge-autonomy";
import type { AutonomousAgentListing } from "./orchestrator";
import { runAutonomousAgent } from "./orchestrator";
import { policyFor } from "./policy";

export type AutonomyRunResult = {
  actions: AutonomousAction[];
  flags: string[];
  executeResult: ExecuteResult;
  /** True when the executor did not block (rate limit / scope / all filtered). */
  executed: boolean;
  _demo?: true;
};

/**
 * `detectAnomalies` → `policyFor` + `runAutonomousAgent` → `mergeAutonomyActions` → `executeActions` + audit.
 */
export async function runAutonomyForListing(
  listing: AutonomousAgentListing,
  ctx: ExecuteContext
): Promise<AutonomyRunResult> {
  if (isDemoMode) {
    return { actions: [], flags: [], executeResult: "no_actions", executed: false, _demo: true };
  }

  const signals: ListingSignals = await getListingSignalsForAutopilot(listing.id);
  const flags = detectAnomalies(signals);
  if (flags.length) {
    sendAlert("Anomaly flags (autonomy input)", { listingId: listing.id, flags });
  }
  const policyAct = policyFor(flags, {
    currentPriceDollars: typeof listing.price === "number" ? listing.price : null,
  });
  const agentAct = await runAutonomousAgent(listing);
  const merged = mergeAutonomyActions(policyAct, agentAct);
  const decision = { policy: policyAct, agent: agentAct, signals };
  let executeResult: ExecuteResult = "no_actions";
  try {
    executeResult = await executeActions(merged, { ...ctx, requireConversionAbWin: true });
  } catch (e) {
    await recordAiActionAudit({
      listingId: listing.id,
      flags,
      decision,
      actions: merged,
      executed: false,
    });
    throw e;
  }
  const executed = executeResult === "ok";
  await recordAiActionAudit({
    listingId: listing.id,
    flags,
    decision,
    actions: merged,
    executed,
  });
  return { actions: merged, flags, executeResult, executed };
}
