import type { DealRequest } from "@prisma/client";
import { DealRequestStatus } from "@prisma/client";

const ORDER: DealRequestStatus[] = [
  DealRequestStatus.DRAFT,
  DealRequestStatus.READY,
  DealRequestStatus.SENT,
  DealRequestStatus.AWAITING_RESPONSE,
  DealRequestStatus.PARTIALLY_FULFILLED,
  DealRequestStatus.FULFILLED,
];

/**
 * Validates transitions; side effects on timestamps are applied in caller via Prisma data.
 */
export function assertValidTransition(from: DealRequestStatus, to: DealRequestStatus): boolean {
  if (to === DealRequestStatus.CANCELLED || to === DealRequestStatus.BLOCKED) return true;
  if (from === DealRequestStatus.CANCELLED) return false;
  if (to === DealRequestStatus.OVERDUE) return true;
  const fi = ORDER.indexOf(from);
  const ti = ORDER.indexOf(to);
  if (ti === -1 || fi === -1) return true;
  return ti >= fi - 1;
}

export function applyRequestStatusSideEffects(
  from: DealRequestStatus,
  to: DealRequestStatus,
  row: Pick<DealRequest, "dueAt" | "fulfilledAt">
): DealRequestStatus {
  if (!assertValidTransition(from, to)) return from;
  if (to === DealRequestStatus.OVERDUE && row.dueAt && row.dueAt.getTime() > Date.now()) return from;
  return to;
}

export function deriveOverdueStatus(status: DealRequestStatus, dueAt: Date | null, now = new Date()): DealRequestStatus {
  if (
    dueAt &&
    dueAt < now &&
    status !== DealRequestStatus.FULFILLED &&
    status !== DealRequestStatus.CANCELLED &&
    status !== DealRequestStatus.BLOCKED
  ) {
    return DealRequestStatus.OVERDUE;
  }
  return status;
}
