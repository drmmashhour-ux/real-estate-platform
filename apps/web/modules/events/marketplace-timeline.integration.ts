/**
 * Records append-only governance outcomes from the autonomous marketplace engine.
 */

import { eventTimelineFlags } from "@/config/feature-flags";
import type { ExecutionResult } from "@/modules/autonomous-marketplace/types/domain.types";
import type { GovernanceResolution } from "@/modules/autonomous-marketplace/types/domain.types";
import type { PolicyDecision } from "@/modules/autonomous-marketplace/types/domain.types";
import type { ProposedAction } from "@/modules/autonomous-marketplace/types/domain.types";
import { mapPolicyGovernanceOutcomeToEvents, recordEventSafe } from "./event-helpers";
import { recordEvent } from "./event.service";

export async function recordAutonomousMarketplaceGovernanceTimeline(params: {
  proposed: ProposedAction;
  policy: PolicyDecision;
  governance: GovernanceResolution;
  execution: ExecutionResult;
  actorUserId: string | null;
}): Promise<void> {
  if (!eventTimelineFlags.eventTimelineV1) return;
  const actorType = params.actorUserId ? "operator" : "system";
  const inputs = mapPolicyGovernanceOutcomeToEvents({
    targetType: params.proposed.target.type,
    targetId: params.proposed.target.id,
    actorId: params.actorUserId,
    actorType,
    policyDisposition: params.policy.disposition,
    governanceDisposition: params.governance.disposition,
    executionStatus: params.execution.status,
  });
  for (const inp of inputs) {
    await recordEventSafe(async () => recordEvent(inp));
  }
}
