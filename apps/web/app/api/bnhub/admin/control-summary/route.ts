import { ListingStatus, ListingVerificationStatus } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Aggregated BNHub trust & safety signals for admin control center. */
export async function GET() {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const [openDisputes, fraudAlerts, highFraudListings, pendingListings] = await Promise.all([
    prisma.dispute.count({
      where: { status: { in: ["OPEN", "SUBMITTED", "UNDER_REVIEW", "EVIDENCE_REVIEW", "ESCALATED"] } },
    }),
    prisma.propertyFraudAlert.findMany({
      where: { status: "open" },
      orderBy: { createdAt: "desc" },
      take: 25,
      include: { listing: { select: { id: true, title: true, listingCode: true } } },
    }),
    prisma.propertyFraudScore.findMany({
      where: { fraudScore: { gte: 60 } },
      orderBy: { fraudScore: "desc" },
      take: 20,
      include: { listing: { select: { id: true, title: true, listingCode: true, listingStatus: true } } },
    }),
    prisma.shortTermListing.count({
      where: {
        OR: [
          { listingStatus: ListingStatus.PENDING_REVIEW },
          { listingVerificationStatus: ListingVerificationStatus.PENDING_VERIFICATION },
        ],
      },
    }),
  ]);

  return Response.json({
    openDisputes,
    fraudAlerts,
    highFraudListings,
    pendingListingApprovals: pendingListings,
  });
}
