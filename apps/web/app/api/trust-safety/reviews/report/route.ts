import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { createIncident } from "@/lib/trust-safety/incident-service";
import { prisma } from "@repo/db";

/**
 * POST /api/trust-safety/reviews/report
 * Report a review (review_abuse). Body: reviewId, accusedUserId?, listingId?, bookingId?, description
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const reviewId = body?.reviewId;
    const description = typeof body.description === "string" ? body.description.trim() : "";
    if (!reviewId) return Response.json({ error: "reviewId required" }, { status: 400 });
    if (!description) return Response.json({ error: "description required" }, { status: 400 });

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, guestId: true, listingId: true, bookingId: true, comment: true },
    });
    if (!review) return Response.json({ error: "Review not found" }, { status: 404 });

    const { incidentId } = await createIncident({
      reporterId: userId,
      accusedUserId: body.accusedUserId ?? review.guestId,
      listingId: body.listingId ?? review.listingId,
      bookingId: body.bookingId ?? review.bookingId,
      incidentCategory: "review_abuse",
      severityLevel: body.severityLevel,
      description: `${description}\n\nReview comment: ${review.comment ?? "(none)"}`,
    });

    return Response.json({ incidentId, message: "Report submitted." });
  } catch (e) {
    return Response.json({ error: "Failed to submit report" }, { status: 400 });
  }
}
