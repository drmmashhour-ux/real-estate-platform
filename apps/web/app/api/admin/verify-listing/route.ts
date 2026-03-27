import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { setVerificationDecision } from "@/lib/verification/ownership";
import { logVerificationAction } from "@/lib/verification/audit";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { captureServerEvent } from "@/lib/analytics/posthog-server";

/**
 * POST /api/admin/verify-listing
 * Fields: listing_id, verification_status (verified | rejected), notes (optional).
 * Admin-only: sets listing verification status and property_verification record.
 */
export async function POST(request: NextRequest) {
  try {
    const adminId = await getGuestId();
    if (!adminId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }
    // In production: enforce admin role, e.g. await requireAdmin(adminId);

    const body = await request.json().catch(() => ({}));
    const listingId = (body.listing_id as string)?.trim();
    const verificationStatusRaw = (body.verification_status as string)?.trim()?.toLowerCase();
    const notes = (body.notes as string)?.trim() || null;

    if (!listingId) {
      return Response.json({ error: "listing_id required" }, { status: 400 });
    }
    if (!verificationStatusRaw || !["verified", "rejected"].includes(verificationStatusRaw)) {
      return Response.json(
        { error: "verification_status must be verified or rejected" },
        { status: 400 }
      );
    }

    const decision: "VERIFIED" | "REJECTED" = verificationStatusRaw === "verified" ? "VERIFIED" : "REJECTED";
    const result = await setVerificationDecision(listingId, decision, adminId, notes);

    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    await logVerificationAction({
      action: decision === "VERIFIED" ? "verify_listing" : "reject_listing",
      listingId,
      adminUserId: adminId,
      verificationStatus: decision.toLowerCase(),
      notes,
    });

    if (decision === "VERIFIED" && result.ok) {
      const owner = await prisma.shortTermListing.findUnique({
        where: { id: listingId },
        select: { ownerId: true },
      });
      if (owner?.ownerId) {
        captureServerEvent(owner.ownerId, AnalyticsEvents.LISTING_VERIFIED, { listingId });
      }
    }

    const status =
      result.listingVerificationStatus === "VERIFIED"
        ? "verified"
        : result.listingVerificationStatus === "REJECTED"
          ? "rejected"
          : result.listingVerificationStatus.toLowerCase();

    return Response.json({
      listing_id: listingId,
      verification_status: status,
      notes,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Verify listing failed" },
      { status: 500 }
    );
  }
}
