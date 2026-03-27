import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";

export class GrowthAuthError extends Error {
  constructor(
    message: string,
    readonly code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND"
  ) {
    super(message);
    this.name = "GrowthAuthError";
  }
}

export async function assertGrowthAdmin(userId: string | null): Promise<string> {
  if (!userId) throw new GrowthAuthError("Sign in required", "UNAUTHORIZED");
  if (!(await isPlatformAdmin(userId))) throw new GrowthAuthError("Admin only", "FORBIDDEN");
  return userId;
}

export async function assertListingGrowthAccess(userId: string | null, listingId: string) {
  if (!userId) throw new GrowthAuthError("Sign in required", "UNAUTHORIZED");
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { id: true, ownerId: true },
  });
  if (!listing) throw new GrowthAuthError("Listing not found", "NOT_FOUND");
  const admin = await isPlatformAdmin(userId);
  if (!admin && listing.ownerId !== userId) throw new GrowthAuthError("Not your listing", "FORBIDDEN");
  return { userId, isAdmin: admin, listing };
}

export async function assertGrowthCampaignAccess(userId: string | null, campaignId: string) {
  const row = await prisma.bnhubGrowthCampaign.findUnique({
    where: { id: campaignId },
    select: { id: true, listingId: true, hostUserId: true },
  });
  if (!row) throw new GrowthAuthError("Campaign not found", "NOT_FOUND");
  await assertListingGrowthAccess(userId, row.listingId);
  return row;
}

export async function assertBnhubLeadAccess(userId: string | null, leadId: string) {
  if (!userId) throw new GrowthAuthError("Sign in required", "UNAUTHORIZED");
  const lead = await prisma.bnhubLead.findUnique({
    where: { id: leadId },
    select: { id: true, hostUserId: true, ownerUserId: true, listingId: true },
  });
  if (!lead) throw new GrowthAuthError("Lead not found", "NOT_FOUND");
  const admin = await isPlatformAdmin(userId);
  if (admin) return { userId, isAdmin: true, lead };
  if (lead.hostUserId === userId || lead.ownerUserId === userId) return { userId, isAdmin: false, lead };
  if (lead.listingId) {
    const l = await prisma.shortTermListing.findUnique({
      where: { id: lead.listingId },
      select: { ownerId: true },
    });
    if (l?.ownerId === userId) return { userId, isAdmin: false, lead };
  }
  throw new GrowthAuthError("Forbidden", "FORBIDDEN");
}
