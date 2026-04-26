/**
 * Limited rollback — only reversible transitions; never throws.
 */

import type { MarketplaceActionProposal } from "./darlink-marketplace-autonomy.types";
import { prisma } from "@/lib/db";
import { persistAutonomyAuditEvent } from "./darlink-autonomy-persistence.service";

export type RollbackResult =
  | { status: "rolled_back"; detail: Record<string, unknown> }
  | { status: "non_reversible"; reason: string };

export async function rollbackMarketplaceAction(params: {
  proposal: MarketplaceActionProposal;
  actorUserId: string | null;
}): Promise<RollbackResult> {
  try {
    const id = params.proposal.entityId;
    if (!id) return { status: "non_reversible", reason: "missing_entity" };

    switch (params.proposal.actionType) {
      case "RECORD_CHECKIN": {
        await prisma.syriaBooking.update({
          where: { id },
          data: { checkedInAt: null },
        });
        await persistAutonomyAuditEvent({
          eventType: "autonomy_action_rolled_back",
          payload: { action: "RECORD_CHECKIN", bookingId: id },
          actorUserId: params.actorUserId,
        });
        return { status: "rolled_back", detail: { bookingId: id } };
      }
      default:
        return {
          status: "non_reversible",
          reason: `action_not_reversible:${params.proposal.actionType}`,
        };
    }
  } catch {
    return { status: "non_reversible", reason: "rollback_failed" };
  }
}
