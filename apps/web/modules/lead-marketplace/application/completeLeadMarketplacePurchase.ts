import type { PrismaClient } from "@prisma/client";
import { LeadMarketplaceStatus } from "@prisma/client";
import { upsertMarketplacePaidBrokerLead } from "@/modules/billing/brokerLeadBilling";
import { recordLeadPurchasedRevenue } from "@/src/modules/revenue/revenueEngine";

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

  const amountDollars = row.priceCents / 100;

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

  void recordLeadPurchasedRevenue({
    buyerUserId: args.buyerUserId,
    leadId: row.leadId,
    amount: amountDollars,
    marketplaceListingId: row.id,
  }).catch(() => {});

  void upsertMarketplacePaidBrokerLead(db, {
    leadId: row.leadId,
    brokerId: args.buyerUserId,
    priceCents: row.priceCents,
  }).catch(() => {});

  return { ok: true };
}
