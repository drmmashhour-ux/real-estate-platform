import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";

export class MarketingAuthError extends Error {
  constructor(
    message: string,
    readonly code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND"
  ) {
    super(message);
    this.name = "MarketingAuthError";
  }
}

export async function assertMarketingAdmin(userId: string | null): Promise<string> {
  if (!userId) throw new MarketingAuthError("Sign in required", "UNAUTHORIZED");
  if (!(await isPlatformAdmin(userId))) throw new MarketingAuthError("Admin only", "FORBIDDEN");
  return userId;
}

/** Host may manage own listings; admin may manage any. */
export async function assertListingMarketingAccess(
  userId: string | null,
  listingId: string
): Promise<{ userId: string; isAdmin: boolean; listing: { id: string; ownerId: string } }> {
  if (!userId) throw new MarketingAuthError("Sign in required", "UNAUTHORIZED");
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { id: true, ownerId: true },
  });
  if (!listing) throw new MarketingAuthError("Listing not found", "NOT_FOUND");
  const admin = await isPlatformAdmin(userId);
  if (!admin && listing.ownerId !== userId) {
    throw new MarketingAuthError("Not your listing", "FORBIDDEN");
  }
  return { userId, isAdmin: admin, listing };
}

export async function assertCampaignAccess(userId: string | null, campaignId: string) {
  const row = await prisma.bnhubMarketingCampaign.findUnique({
    where: { id: campaignId },
    select: { id: true, listingId: true, hostUserId: true },
  });
  if (!row) throw new MarketingAuthError("Campaign not found", "NOT_FOUND");
  await assertListingMarketingAccess(userId, row.listingId);
  return row;
}
