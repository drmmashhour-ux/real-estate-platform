import type { PrismaClient } from "@prisma/client";
import { LeadMarketplaceStatus } from "@prisma/client";
import { recalculateLeadLecipmScores } from "@/modules/crm/application/recalculateLeadLecipmScores";
import { calculateLeadPriceCents, calculateMarketplaceListingScore, type LeadPricingInput } from "./calculateLeadPrice";
import { getCityDemand01 } from "../infrastructure/cityDemand";

export async function publishLeadToMarketplace(
  db: PrismaClient,
  leadId: string
): Promise<
  | { ok: true; marketplaceListingId: string; priceCents: number; score: number }
  | { ok: false; reason: string }
> {
  const lead = await db.lead.findUnique({
    where: { id: leadId },
    include: { fsboListing: { select: { city: true } } },
  });
  if (!lead) return { ok: false, reason: "lead_not_found" };

  await recalculateLeadLecipmScores(db, leadId).catch(() => {});

  const fresh = await db.lead.findUnique({
    where: { id: leadId },
    include: { fsboListing: { select: { city: true } } },
  });
  if (!fresh) return { ok: false, reason: "lead_not_found" };

  const cityDemand01 = await getCityDemand01(db, fresh.fsboListing?.city ?? fresh.purchaseRegion ?? null);

  const pricingIn: LeadPricingInput = {
    dealScore: fresh.lecipmDealQualityScore,
    trustScore: fresh.lecipmTrustScore,
    engagementScore: fresh.engagementScore,
    highIntent: fresh.highIntent,
    cityDemand01,
  };

  const priceCents = calculateLeadPriceCents(pricingIn);
  const score = calculateMarketplaceListingScore(pricingIn);

  const existing = await db.leadMarketplaceListing.findUnique({ where: { leadId } });
  if (existing?.status === LeadMarketplaceStatus.sold) {
    return { ok: false, reason: "already_sold" };
  }

  const row = await db.leadMarketplaceListing.upsert({
    where: { leadId },
    create: {
      leadId,
      fsboListingId: fresh.fsboListingId,
      score,
      priceCents,
      status: LeadMarketplaceStatus.available,
    },
    update: {
      fsboListingId: fresh.fsboListingId,
      score,
      priceCents,
      status: LeadMarketplaceStatus.available,
    },
  });

  await db.lead.update({
    where: { id: leadId },
    data: { dynamicLeadPriceCents: priceCents },
  });

  return { ok: true, marketplaceListingId: row.id, priceCents, score };
}
