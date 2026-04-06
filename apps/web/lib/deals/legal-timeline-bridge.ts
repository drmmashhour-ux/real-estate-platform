import { prisma } from "@/lib/db";
import { recordDealLegalAction } from "@/lib/deals/legal-timeline";

export async function autoRecordDealLegalActionFromOffer(args: {
  listingId: string;
  buyerId: string;
  actorUserId: string;
  action: "COUNTER_PROPOSAL_SENT" | "OFFER_ACCEPTED";
  note: string;
}) {
  const deal = await prisma.deal.findFirst({
    where: {
      listingId: args.listingId,
      buyerId: args.buyerId,
      status: { notIn: ["closed", "cancelled"] },
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });

  if (!deal) return null;

  return recordDealLegalAction({
    dealId: deal.id,
    actorUserId: args.actorUserId,
    action: args.action,
    note: args.note,
  }).catch(() => null);
}
