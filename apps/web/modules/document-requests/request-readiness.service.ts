import { DealRequestItemStatus, DealRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

/** Share of required items validated — 0..1 */
export async function computeRequestCompleteness(requestId: string): Promise<number> {
  const items = await prisma.dealRequestItem.findMany({ where: { dealRequestId: requestId } });
  const required = items.filter((i) => i.isRequired);
  if (required.length === 0) return items.length ? 1 : 0;
  const done = required.filter((i) => i.status === DealRequestItemStatus.VALIDATED).length;
  return done / required.length;
}

export async function refreshDealReadiness(dealId: string) {
  const requests = await prisma.dealRequest.findMany({ where: { dealId }, include: { items: true } });
  return requests.map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    completeness: r.items.filter((i) => i.isRequired).length
      ? r.items.filter((i) => i.isRequired && i.status === DealRequestItemStatus.VALIDATED).length /
        r.items.filter((i) => i.isRequired).length
      : 1,
    blocking:
      r.status === DealRequestStatus.BLOCKED
        ? (r.blockedReason ?? "Blocked")
        : null,
  }));
}
