import { prisma } from "@repo/db";
import { requireMobileAdmin } from "@/lib/mobile/mobileAuth";

export const dynamic = "force-dynamic";

/**
 * Admin moderation summary — no fraud evidence payloads (fetch detail via admin web tools).
 */
export async function GET(request: Request) {
  try {
    await requireMobileAdmin(request);
    const [safetyPending, safetyManual, openSafetyFlags, pendingListings, disputedBookings] = await Promise.all([
      prisma.bnhubListingSafetyProfile.count({
        where: { reviewStatus: "PENDING" },
      }),
      prisma.bnhubListingSafetyProfile.count({
        where: { reviewStatus: "MANUAL_REVIEW_REQUIRED" },
      }),
      prisma.bnhubSafetyFlag.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
      prisma.shortTermListing.count({ where: { listingStatus: "PENDING_REVIEW" } }),
      prisma.booking.count({ where: { status: "DISPUTED" } }),
    ]);
    const fraudOpen = await prisma.bnhubFraudFlag.count({
      where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
    });
    return Response.json({
      queues: {
        listingApproval: pendingListings,
        safetyReview: safetyPending + safetyManual,
        safetyFlagsOpen: openSafetyFlags,
        fraudFlagsOpen: fraudOpen,
        disputedBookings,
      },
      note: "Open admin web hub for evidence-backed review. Mobile shows counts only.",
    });
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.status === 401) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (err.status === 403) return Response.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }
}
