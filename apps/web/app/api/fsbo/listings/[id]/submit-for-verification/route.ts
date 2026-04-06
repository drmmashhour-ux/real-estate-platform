import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { FSBO_STATUS } from "@/lib/fsbo/constants";
import { assertSellerHubSubmitReady } from "@/lib/fsbo/seller-hub-validation";
import { ensureFsboListingDocumentSlots } from "@/lib/fsbo/seller-hub-seed-documents";
import { persistSellerDeclarationAiReview } from "@/lib/fsbo/seller-declaration-ai-review";
import type { RiskAlertSeverity } from "@prisma/client";
import { isTrustGraphEnabled } from "@/lib/trustgraph/config";
import { assertListingPublishTrustGate } from "@/lib/trustgraph/application/integrations/listingPublishIntegration";

export const dynamic = "force-dynamic";

/**
 * POST — Submit listing for admin verification (Seller Hub). Sets status PENDING_VERIFICATION.
 */
export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  await ensureFsboListingDocumentSlots(id);

  const listing = await prisma.fsboListing.findUnique({
    where: { id },
    include: { documents: true, sellerSupportingDocuments: { select: { category: true, status: true, declarationSectionKey: true } } },
  });
  if (!listing || listing.ownerId !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (listing.status === "SOLD") {
    return Response.json({ error: "Listing is sold" }, { status: 409 });
  }
  if (listing.status === FSBO_STATUS.PENDING_VERIFICATION) {
    return Response.json({ error: "Already submitted for verification" }, { status: 409 });
  }
  if (listing.status === FSBO_STATUS.ACTIVE) {
    return Response.json({ error: "Listing is already active" }, { status: 409 });
  }

  const gate = await assertSellerHubSubmitReady(listing, listing.documents, listing.sellerSupportingDocuments);
  if (!gate.ok) {
    return Response.json({ error: "Validation failed", details: gate.errors }, { status: 400 });
  }

  // Admin flag system for photo mismatch (set by the photo verification heuristic).
  // Even if the user confirms photos, flagged listings still go to admin review.
  const PHOTO_MISMATCH_RISK_TYPE = "FSBO_PHOTO_MISMATCH";
  if (listing.photoVerificationStatus === "FLAGGED") {
    await prisma.riskAlert.deleteMany({
      where: { fsboListingId: listing.id, riskType: PHOTO_MISMATCH_RISK_TYPE },
    });
    await prisma.riskAlert.create({
      data: {
        userId,
        fsboListingId: listing.id,
        riskType: PHOTO_MISMATCH_RISK_TYPE,
        message: "Exterior photo may not match the declared property address. Please review uploaded photos and address details.",
        severity: "HIGH" as RiskAlertSeverity,
      },
    });
  }

  await persistSellerDeclarationAiReview(id);

  if (isTrustGraphEnabled()) {
    const gate = await assertListingPublishTrustGate({
      listingId: id,
      actorUserId: userId,
      publishPlan: "basic",
    });
    if (!gate.ok) {
      return Response.json(
        {
          error: gate.userMessage,
          trustGraph: {
            blocking: gate.blocking.map((b) => ({ ruleCode: b.ruleCode, message: b.message })),
            warnings: gate.warnings.map((w) => ({ ruleCode: w.ruleCode, message: w.message })),
          },
        },
        { status: 403 }
      );
    }
  }

  await prisma.fsboListing.update({
    where: { id },
    data: {
      status: FSBO_STATUS.PENDING_VERIFICATION,
      moderationStatus: "PENDING",
      rejectReason: null,
    },
  });

  return Response.json({ ok: true, status: FSBO_STATUS.PENDING_VERIFICATION });
}
