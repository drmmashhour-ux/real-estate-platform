import { ListingStatus, ListingVerificationStatus, BookingStatus } from "@prisma/client";
import { subDays } from "date-fns";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

/** Aggregated BNHUB trust & safety signals for admin control center. */
export async function GET() {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const stalePendingCutoff = subDays(new Date(), 3);

  const [
    openDisputes,
    fraudAlerts,
    highFraudListings,
    pendingListings,
    bookingsPendingStale,
    bookingsAwaitingHost,
    openBookingIssues,
  ] = await Promise.all([
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
    prisma.booking.count({
      where: {
        status: BookingStatus.PENDING,
        createdAt: { lt: stalePendingCutoff },
      },
    }),
    prisma.booking.count({
      where: { status: BookingStatus.AWAITING_HOST_APPROVAL },
    }),
    prisma.bookingIssue.count({
      where: { status: "open" },
    }),
  ]);

  return Response.json({
    openDisputes,
    fraudAlerts,
    highFraudListings,
    pendingListingApprovals: pendingListings,
    bookingsPendingStale,
    bookingsAwaitingHost,
    openBookingIssues,
  });
}
