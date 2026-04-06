import type { AutonomousAction } from "@/lib/autonomy/types";
import type { MarketplaceAutonomyApproval } from "@prisma/client";
import type { ApprovalStatus } from "./types";

/**
 * Domain shape for Level-4 approval UI (maps to `MarketplaceAutonomyApproval`).
 */
export type ApprovalQueueItem = {
  id: string;
  status: ApprovalStatus | "executed";
  action: AutonomousAction;
  createdAt: Date;
  summary: string | null;
  requestedByUserId: string | null;
  reviewedByUserId: string | null;
  reviewNote: string | null;
  executedAt: Date | null;
};

function parsePayload(row: MarketplaceAutonomyApproval): AutonomousAction {
  const p = row.payload as Record<string, unknown> | null;
  const embedded = p?.autonomousAction as Record<string, unknown> | undefined;
  if (embedded && typeof embedded.id === "string" && typeof embedded.type === "string") {
    return {
      id: String(embedded.id),
      type: String(embedded.type),
      payload: (embedded.payload as Record<string, unknown>) ?? {},
      risk: (embedded.risk as AutonomousAction["risk"]) ?? "medium",
    };
  }
  return {
    id: row.id,
    type: row.actionType,
    payload: p ?? {},
    risk: (row.riskTier as AutonomousAction["risk"]) ?? "medium",
  };
}

export function approvalFromDbRow(row: MarketplaceAutonomyApproval): ApprovalQueueItem {
  const st = row.status as ApprovalQueueItem["status"];
  return {
    id: row.id,
    status: st,
    action: parsePayload(row),
    createdAt: row.createdAt,
    summary: row.summary,
    requestedByUserId: row.requestedByUserId,
    reviewedByUserId: row.reviewedByUserId,
    reviewNote: row.reviewNote,
    executedAt: row.executedAt,
  };
}

export function payloadForAutonomousAction(action: AutonomousAction, extra?: Record<string, unknown>) {
  return {
    autonomousAction: action,
    ...extra,
  };
}
