import { prisma } from "@/lib/db";
import { trustFlags } from "@/config/feature-flags";
import { buildPublicTrustPayload } from "./trust-public";
import type { PublicTrustPayload } from "./trust.types";

function daysSince(d: Date): number {
  return Math.max(0, (Date.now() - d.getTime()) / 86400000);
}

/** Lightweight seller/listing-owner trust for public listing pages (verification + tenure; no Legal Hub fetch). */
export async function getOwnerPublicTrustForListing(ownerId: string): Promise<PublicTrustPayload | null> {
  try {
    if (!trustFlags.trustScoringV1 && !trustFlags.trustBadgesV1) return null;
    const u = await prisma.user.findUnique({
      where: { id: ownerId },
      select: {
        createdAt: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        stripeOnboardingComplete: true,
        brokerVerifications: {
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: { verificationStatus: true },
        },
      },
    });
    if (!u) return null;
    return buildPublicTrustPayload({
      accountAgeDays: daysSince(u.createdAt),
      verificationFlags: {
        emailVerified: u.emailVerifiedAt != null,
        phoneVerified: u.phoneVerifiedAt != null,
        stripeOnboardingComplete: u.stripeOnboardingComplete === true,
        brokerLicenseVerified: u.brokerVerifications[0]?.verificationStatus === "VERIFIED",
      },
      badgeContext: {
        persona: "seller",
        emailVerified: u.emailVerifiedAt != null,
        phoneVerified: u.phoneVerifiedAt != null,
        stripeOnboardingComplete: u.stripeOnboardingComplete === true,
        brokerLicenseVerified: u.brokerVerifications[0]?.verificationStatus === "VERIFIED",
      },
      includeBadges: trustFlags.trustBadgesV1,
    });
  } catch {
    return null;
  }
}
