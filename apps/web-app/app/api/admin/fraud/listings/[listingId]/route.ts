import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { updateListing } from "@/lib/bnhub/listings";
import { requestMoreDocuments } from "@/lib/verification/ownership";
import {
  freezeListing,
  holdPayoutsForListing,
  restrictUser,
  restoreListing,
  releasePayoutHoldsForListing,
  removeListing,
  banUser,
} from "@/lib/trust-safety/fraud-response";

type Action = "freeze" | "approve" | "reject" | "ban_host" | "request_documents";

/**
 * PATCH /api/admin/fraud/listings/:listingId
 * Body: { action: "freeze" | "approve" | "reject" | "request_documents", publish?: boolean, reason?: string }
 * Admin fraud actions on a listing.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ listingId: string }> }
) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }
    // In production: restrict to admin role

    const { listingId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const action = (body.action as Action) || "";
    const publish = !!body.publish;
    const reason = (body.reason as string)?.trim() || "";

    const listing = await prisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: { id: true, listingStatus: true, listingVerificationStatus: true, ownerId: true },
    });
    if (!listing) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }

    if (action === "freeze") {
      await freezeListing(listingId);
      await holdPayoutsForListing(listingId, "fraud_investigation");
      await restrictUser(listing.ownerId);
      return Response.json({
        success: true,
        listingStatus: "UNDER_INVESTIGATION",
        message: "Listing frozen, payouts held, account restricted.",
      });
    }

    if (action === "approve") {
      await releasePayoutHoldsForListing(listingId);
      const newStatus = publish ? "PUBLISHED" : "DRAFT";
      await updateListing(listingId, { listingStatus: newStatus });
      return Response.json({ success: true, listingStatus: newStatus });
    }

    if (action === "reject") {
      await removeListing(listingId);
      await restrictUser(listing.ownerId);
      return Response.json({ success: true, listingStatus: "SUSPENDED", message: "Listing removed, host restricted." });
    }

    if (action === "ban_host") {
      await banUser(listing.ownerId);
      await removeListing(listingId);
      return Response.json({ success: true, message: "Host banned, listing removed." });
    }

    if (action === "request_documents") {
      const result = await requestMoreDocuments(listingId, userId, reason || "Please submit additional documents for fraud review.");
      if (!result.ok) {
        return Response.json({ error: result.error }, { status: 400 });
      }
      return Response.json({ success: true, listingVerificationStatus: result.listingVerificationStatus });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Action failed" }, { status: 500 });
  }
}
