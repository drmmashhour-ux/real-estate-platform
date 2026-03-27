import type { PrismaClient } from "@prisma/client";
import { LeadMarketplaceStatus } from "@prisma/client";

export async function completeLeadMarketplacePurchase(
  db: PrismaClient,
  args: { marketplaceListingId: string; buyerUserId: string; stripeSessionId: string }
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const row = await db.leadMarketplaceListing.findUnique({
    where: { id: args.marketplaceListingId },
  });
  if (!row) return { ok: false, reason: "listing_not_found" };
  if (row.status === LeadMarketplaceStatus.sold) return { ok: false, reason: "already_sold" };
  if (row.status === LeadMarketplaceStatus.withdrawn) return { ok: false, reason: "withdrawn" };

  await db.$transaction([
    db.leadMarketplaceListing.update({
      where: { id: row.id },
      data: {
        status: LeadMarketplaceStatus.sold,
        buyerUserId: args.buyerUserId,
        purchasedAt: new Date(),
        stripeSessionId: args.stripeSessionId,
      },
    }),
    db.lead.update({
      where: { id: row.leadId },
      data: {
        introducedByBrokerId: args.buyerUserId,
        lastFollowUpByBrokerId: args.buyerUserId,
        contactUnlockedAt: new Date(),
      },
    }),
  ]);

  return { ok: true };
}
