import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { openInvestigation } from "@/lib/trust-safety/investigation-service";
import { FRAUD_REASON_CODES } from "@/lib/trust-safety/constants";
import { prisma } from "@/lib/db";

/**
 * POST /api/fraud/report-listing
 * Report a listing as potentially fraudulent. Opens an investigation and optionally freezes the listing.
 * Body: { listingId: string, fraudReason: string, freezeListing?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const listingId = body?.listingId;
    const fraudReason = body?.fraudReason ?? "other";
    const freezeListing = body?.freezeListing !== false;

    if (!listingId || typeof listingId !== "string") {
      return Response.json({ error: "listingId required" }, { status: 400 });
    }

    const listing = await prisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: { id: true },
    });
    if (!listing) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }

    const reason = FRAUD_REASON_CODES.includes(fraudReason as (typeof FRAUD_REASON_CODES)[number])
      ? fraudReason
      : "other";

    const { investigationId } = await openInvestigation({
      listingId,
      fraudReason: reason,
      openedBy: userId,
      freezeListing,
    });

    return Response.json({
      success: true,
      investigationId,
      message: freezeListing
        ? "Listing reported. Investigation opened and listing frozen."
        : "Listing reported. Investigation opened.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to report listing";
    return Response.json({ error: message }, { status: 400 });
  }
}
