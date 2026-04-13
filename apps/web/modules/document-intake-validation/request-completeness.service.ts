import { DealRequestItemStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function requestCompletenessPercent(requestId: string): Promise<number> {
  const items = await prisma.dealRequestItem.findMany({ where: { dealRequestId: requestId } });
  const required = items.filter((i) => i.isRequired);
  if (!required.length) return 100;
  const ok = required.filter((i) => i.status === DealRequestItemStatus.VALIDATED).length;
  return Math.round((ok / required.length) * 100);
}
