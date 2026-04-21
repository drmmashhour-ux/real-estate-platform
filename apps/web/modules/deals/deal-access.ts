import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { userCanManageListingListing } from "@/modules/esg/esg.service";
import { committeeActorRoles } from "@/modules/deals/deal-policy";

export async function userCanViewPipelineDeal(userId: string, dealId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return false;
  if (user.role === PlatformRole.ADMIN) return true;

  const deal = await prisma.investmentPipelineDeal.findUnique({
    where: { id: dealId },
    select: { ownerUserId: true, sponsorUserId: true, listingId: true },
  });
  if (!deal) return false;
  if (deal.ownerUserId === userId || deal.sponsorUserId === userId) return true;
  if (deal.listingId && (await userCanManageListingListing(userId, deal.listingId))) return true;
  if (user.role === PlatformRole.INVESTOR && deal.listingId) {
    const listing = await prisma.listing.findUnique({
      where: { id: deal.listingId },
      select: { ownerId: true },
    });
    return listing?.ownerId === userId;
  }
  return user.role === PlatformRole.BROKER;
}

export async function userCanMutatePipelineDeal(userId: string, dealId: string): Promise<boolean> {
  return userCanViewPipelineDeal(userId, dealId);
}

export async function userCanRecordCommitteeDecision(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return false;
  return committeeActorRoles().has(user.role);
}

export async function userCanWaiveCriticalCondition(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return false;
  return user.role === PlatformRole.ADMIN || user.role === PlatformRole.BROKER;
}
