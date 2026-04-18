/**
 * Rollback snapshots for executed BNHub autopilot actions (in-memory; paired with execution).
 */

import { prisma } from "@/lib/db";
import type { BNHubAutopilotRollbackSnapshot } from "./bnhub-autopilot.types";
import { getBnhubAutopilotAction, updateBnhubAutopilotAction } from "./bnhub-autopilot-store.service";
import { recordBnhubAutopilotRolledBack } from "./bnhub-autopilot-monitoring.service";
import { bnhubAutopilotExecutionFlags } from "@/config/feature-flags";

const rollbackByActionId = new Map<string, BNHubAutopilotRollbackSnapshot>();

export function storeRollbackSnapshot(snap: BNHubAutopilotRollbackSnapshot): void {
  rollbackByActionId.set(snap.actionId, snap);
}

export function getRollbackSnapshot(actionId: string): BNHubAutopilotRollbackSnapshot | undefined {
  return rollbackByActionId.get(actionId);
}

export function resetBnhubAutopilotRollbackForTests(): void {
  rollbackByActionId.clear();
}

/**
 * Restores previous listing field from snapshot. Does not touch payments or bookings.
 */
export async function rollbackBNHubAction(actionId: string): Promise<{ ok: boolean; error?: string }> {
  if (!bnhubAutopilotExecutionFlags.autopilotV1 || !bnhubAutopilotExecutionFlags.rollbackV1) {
    return { ok: false, error: "flags_off" };
  }

  const action = getBnhubAutopilotAction(actionId);
  if (!action || action.status !== "executed") {
    return { ok: false, error: "not_executed" };
  }

  const snap = rollbackByActionId.get(actionId);
  if (!snap) {
    return { ok: false, error: "no_snapshot" };
  }

  try {
    if (snap.field === "title") {
      await prisma.shortTermListing.update({
        where: { id: snap.listingId },
        data: { title: typeof snap.previousValue === "string" ? snap.previousValue : String(snap.previousValue ?? "") },
      });
    } else if (snap.field === "description") {
      await prisma.shortTermListing.update({
        where: { id: snap.listingId },
        data: {
          description:
            snap.previousValue == null ? null : typeof snap.previousValue === "string" ? snap.previousValue : String(snap.previousValue),
        },
      });
    } else if (snap.field === "amenities") {
      await prisma.shortTermListing.update({
        where: { id: snap.listingId },
        data: { amenities: snap.previousValue ?? [] },
      });
    }

    rollbackByActionId.delete(actionId);
    updateBnhubAutopilotAction(actionId, { status: "rejected" });
    try {
      recordBnhubAutopilotRolledBack(actionId);
    } catch {
      /* */
    }
    // eslint-disable-next-line no-console
    console.log("[bnhub:autopilot]", "rollback_applied", { actionId: actionId.slice(0, 12), listingId: snap.listingId.slice(0, 8) });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "rollback_failed" };
  }
}
