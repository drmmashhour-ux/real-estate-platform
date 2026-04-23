import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { VERIFICATION_TYPES, VERIFICATION_STATUSES } from "@/lib/property-identity/constants";
import { updatePropertyIdentityVerificationScore } from "@/lib/property-identity/verification-score";
import { recordEvent } from "@/lib/property-identity/events";

/**
 * POST /api/property-identity/:id/verify
 * Body: verification_type, verification_status, notes?
 * Add or update a verification record. In production restrict to admin or system.
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

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const verificationType = body.verification_type as string;
    const verificationStatus = body.verification_status as string;
    const notes = body.notes as string | undefined;

    if (!verificationType || !VERIFICATION_TYPES.includes(verificationType as never)) {
      return Response.json({ error: "Invalid verification_type" }, { status: 400 });
    }
    if (!verificationStatus || !VERIFICATION_STATUSES.includes(verificationStatus as never)) {
      return Response.json({ error: "Invalid verification_status" }, { status: 400 });
    }

    const identity = await prisma.propertyIdentity.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!identity) {
      return Response.json({ error: "Property identity not found" }, { status: 404 });
    }

    await prisma.propertyIdentityVerification.create({
      data: {
        propertyIdentityId: id,
        verificationType,
        verificationStatus,
        verifiedBy: userId,
        verifiedAt: verificationStatus === "verified" || verificationStatus === "rejected" ? new Date() : null,
        notes: notes ?? undefined,
      },
    });

    const score = await updatePropertyIdentityVerificationScore(id);
    await recordEvent(id, "verification_completed", { verification_type: verificationType, verification_status: verificationStatus }, userId);

    return Response.json({
      success: true,
      verification_type: verificationType,
      verification_status: verificationStatus,
      verification_score: score,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Verify failed" },
      { status: 500 }
    );
  }
}
