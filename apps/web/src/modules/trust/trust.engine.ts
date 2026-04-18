import { fraudTrustV1Flags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import type { TrustEvaluation } from "./trust.types";
import { scoreFsboListingTrust, scoreUserTrust } from "./trust.scoring";
import { logTrustEngineEvaluation } from "./trust.logger";

export async function evaluateUserTrust(userId: string): Promise<TrustEvaluation | null> {
  if (!fraudTrustV1Flags.trustSystemV1) return null;

  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      createdAt: true,
    },
  });
  if (!u) return null;

  const idv = await prisma.identityVerification.findUnique({
    where: { userId },
    select: { verificationStatus: true },
  });

  const [incidents, payments] = await Promise.all([
    prisma.trustSafetyIncident.count({ where: { accusedUserId: userId } }),
    prisma.platformPayment.count({ where: { userId, status: "paid" } }),
  ]);

  const accountAgeDays = (Date.now() - u.createdAt.getTime()) / 86400000;

  const ev = scoreUserTrust({
    emailVerified: !!u.emailVerifiedAt,
    phoneVerified: !!u.phoneVerifiedAt,
    identityVerified: idv?.verificationStatus === "VERIFIED",
    accountAgeDays,
    incidentReportsAgainst: incidents,
    completedPayments: payments,
  });

  await logTrustEngineEvaluation({
    entityType: "user",
    entityId: userId,
    kind: "user_trust",
    resultJson: { ...ev, privacyNote: "Incident counts are admin-only aggregates." },
  });

  return ev;
}

export async function evaluateFsboListingTrust(listingId: string): Promise<TrustEvaluation | null> {
  if (!fraudTrustV1Flags.trustSystemV1) return null;

  const row = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: {
      trustScore: true,
      riskScore: true,
      description: true,
      images: true,
      moderationStatus: true,
    },
  });
  if (!row) return null;

  const images = Array.isArray(row.images) ? row.images.length : 0;
  const ev = scoreFsboListingTrust({
    trustScore: row.trustScore,
    riskScore: row.riskScore,
    imageCount: images,
    descriptionLen: row.description?.trim().length ?? 0,
    moderationStatus: row.moderationStatus,
  });

  await logTrustEngineEvaluation({
    entityType: "fsbo_listing",
    entityId: listingId,
    kind: "listing_trust",
    resultJson: ev as unknown as Record<string, unknown>,
  });

  return ev;
}
