import type { InvestorAccess } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * BNHub investor scopes (`InvestorAccess.scopeId`) currently resolve to the host `User.id`.
 * Listings under that host are eligible for portal recommendation views / actions.
 */
export async function listBnhubListingIdsForInvestorScope(investor: InvestorAccess): Promise<string[]> {
  const rows = await prisma.shortTermListing.findMany({
    where: { ownerId: investor.scopeId },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

export async function investorMayAccessListingRecommendation(
  investor: InvestorAccess,
  recommendationId: string
): Promise<boolean> {
  const rec = await prisma.investmentRecommendation.findUnique({
    where: { id: recommendationId },
    select: { scopeType: true, scopeId: true },
  });
  if (!rec || rec.scopeType !== "listing") return false;

  const listing = await prisma.shortTermListing.findFirst({
    where: { id: rec.scopeId, ownerId: investor.scopeId },
    select: { id: true },
  });
  return Boolean(listing);
}
