import type { VerificationRequestStatus } from "@prisma/client";
import { VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { syncUserVerificationProfile } from "@/lib/trust/sync-verification-profile";
import { updatePlatformTrustScore } from "@/lib/trust/update-trust-score";

export async function reviewVerificationRequest(params: {
  requestId: string;
  reviewerUserId: string;
  status: Exclude<VerificationRequestStatus, "pending">;
  note?: string;
}): Promise<void> {
  const req = await prisma.verificationRequest.findUnique({ where: { id: params.requestId } });
  if (!req || req.status !== "pending") {
    throw new Error("Request not found or not pending");
  }

  await prisma.$transaction(async (tx) => {
    await tx.verificationRequest.update({
      where: { id: params.requestId },
      data: {
        status: params.status,
        reviewedAt: new Date(),
        reviewedByUserId: params.reviewerUserId,
        notes: params.note?.trim() ? `${req.notes ?? ""}\n[review] ${params.note}`.trim() : req.notes,
      },
    });

    if (params.status === "approved") {
      if (req.type === "broker" && req.userId) {
        await tx.brokerVerification.updateMany({
          where: { userId: req.userId },
          data: {
            verificationStatus: VerificationStatus.VERIFIED,
            verifiedAt: new Date(),
            verifiedById: params.reviewerUserId,
          },
        });
      }

      if (req.type === "listing" && req.listingId) {
        await tx.listingVerification.upsert({
          where: { listingId: req.listingId },
          create: {
            listingId: req.listingId,
            contactVerified: true,
            addressVerified: true,
            photoVerified: true,
            contentReviewed: true,
            verificationLevel: "enhanced",
          },
          update: {
            contactVerified: true,
            addressVerified: true,
            photoVerified: true,
            contentReviewed: true,
            verificationLevel: "enhanced",
          },
        });
      }
    }
  });

  if (params.status === "approved" && req.type === "broker" && req.userId) {
    await syncUserVerificationProfile(req.userId);
  }

  if (req.userId) {
    await updatePlatformTrustScore("user", req.userId);
    await updatePlatformTrustScore("broker", req.userId).catch(() => {});
    await updatePlatformTrustScore("host", req.userId).catch(() => {});
  }
  if (req.listingId) {
    await updatePlatformTrustScore("listing", req.listingId);
    const listing = await prisma.shortTermListing.findUnique({
      where: { id: req.listingId },
      select: { ownerId: true },
    });
    if (listing?.ownerId) {
      await updatePlatformTrustScore("host", listing.ownerId);
    }
  }
}
