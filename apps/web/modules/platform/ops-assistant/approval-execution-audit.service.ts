/**
 * Append-only audit trail for approval execution — never throws.
 */

import { randomBytes } from "node:crypto";

import type { ApprovalAuditEntry, ApprovalAuditEventKind, ApprovalExecutableActionKind } from "./approval-execution.types";
import { appendAuditRaw } from "./approval-execution.store";

function rid(): string {
  return `audit_${randomBytes(10).toString("hex")}`;
}

export function appendApprovalAudit(entry: {
  kind: ApprovalAuditEventKind;
  actionType: ApprovalExecutableActionKind;
  priorityId: string;
  requestId: string;
  operatorId?: string;
  explanation: string;
  meta?: Record<string, unknown>;
}): void {
  try {
    const row: ApprovalAuditEntry = {
      id: rid(),
      kind: entry.kind,
      at: new Date().toISOString(),
      actionType: entry.actionType,
      priorityId: entry.priorityId,
      requestId: entry.requestId,
      operatorId: entry.operatorId,
      explanation: entry.explanation,
      meta: entry.meta,
    };
    appendAuditRaw(row);
  } catch {
    /* never throw */
  }
}
