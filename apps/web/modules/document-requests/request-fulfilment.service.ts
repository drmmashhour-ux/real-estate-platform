import { DealRequestItemStatus, DealRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Recompute parent request status from items.
 * Rule: fulfilled only when required items validated; partial when some received.
 */
export async function recomputeRequestFulfillment(requestId: string) {
  const req = await prisma.dealRequest.findUnique({
    where: { id: requestId },
    include: { items: true },
  });
  if (!req) return null;
  if (req.status === DealRequestStatus.CANCELLED || req.status === DealRequestStatus.BLOCKED) {
    return req;
  }

  const items = req.items;
  const required = items.filter((i) => i.isRequired);
  const optional = items.filter((i) => !i.isRequired);
  const validated = (i: typeof items[0]) => i.status === DealRequestItemStatus.VALIDATED;
  const received = (i: typeof items[0]) =>
    i.status === DealRequestItemStatus.RECEIVED || i.status === DealRequestItemStatus.VALIDATED;

  let next: DealRequestStatus = req.status;
  if (required.length === 0 && optional.every(validated)) {
    next = DealRequestStatus.FULFILLED;
  } else if (required.length > 0 && required.every(validated)) {
    next = DealRequestStatus.FULFILLED;
  } else if (required.some(received) || optional.some(received)) {
    if (req.status === DealRequestStatus.SENT || req.status === DealRequestStatus.AWAITING_RESPONSE) {
      next = DealRequestStatus.PARTIALLY_FULFILLED;
    }
  }

  const fulfilledAt =
    next === DealRequestStatus.FULFILLED ? new Date() : req.fulfilledAt ?? undefined;

  return prisma.dealRequest.update({
    where: { id: requestId },
    data: {
      status: next,
      fulfilledAt: fulfilledAt ?? (next === DealRequestStatus.FULFILLED ? new Date() : null),
    },
    include: { items: true },
  });
}
