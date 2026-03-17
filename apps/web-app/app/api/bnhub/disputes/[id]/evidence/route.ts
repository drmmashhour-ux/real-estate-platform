import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { addDisputeEvidence } from "@/lib/bnhub/disputes";
import { prisma } from "@/lib/db";

/**
 * POST /api/bnhub/disputes/:id/evidence
 * Add an evidence item (URL from upload). Body: { url: string, label?: string }
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const { id: disputeId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const url = body?.url;
    const label = body?.label;

    if (!url || typeof url !== "string" || !url.trim()) {
      return Response.json({ error: "url required" }, { status: 400 });
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      select: { id: true, claimantUserId: true, booking: { select: { guestId: true, listing: { select: { ownerId: true } } } } },
    });
    if (!dispute) return Response.json({ error: "Dispute not found" }, { status: 404 });

    const isGuest = dispute.booking.guestId === userId;
    const isHost = dispute.booking.listing.ownerId === userId;
    if (!isGuest && !isHost) {
      return Response.json({ error: "Only guest or host can add evidence" }, { status: 403 });
    }

    const evidence = await addDisputeEvidence({
      disputeId,
      url: url.trim(),
      label: typeof label === "string" ? label : undefined,
      uploadedBy: userId,
    });

    return Response.json(evidence);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to add evidence" }, { status: 500 });
  }
}
