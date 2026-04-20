import { prisma } from "@/lib/db";
import { trustFlags } from "@/config/feature-flags";
import { computeTrustBadges } from "./trust-badge.service";
import { computeTrustScore } from "./trust-score.service";
import { computeVisibilityImpact } from "./trust-visibility.service";
import type { TrustBadge } from "./trust.types";

function daysSince(d: Date): number {
  return Math.max(0, (Date.now() - d.getTime()) / 86400000);
}

export type TrustBrowseAugmentation = {
  rankingBoost: Map<string, number>;
  badges: Map<string, TrustBadge[]>;
};

/**
 * Batch trust signals for FSBO browse — one query, deterministic maps.
 */
export async function batchTrustBrowseAugmentation(ownerIds: string[]): Promise<TrustBrowseAugmentation> {
  const rankingBoost = new Map<string, number>();
  const badges = new Map<string, TrustBadge[]>();
  try {
    if ((!trustFlags.trustRankingV1 && !trustFlags.trustBadgesV1) || ownerIds.length === 0) {
      return { rankingBoost, badges };
    }
    const uniq = [...new Set(ownerIds.filter(Boolean))];
    if (uniq.length === 0) return { rankingBoost, badges };

    const users = await prisma.user.findMany({
      where: { id: { in: uniq } },
      select: {
        id: true,
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

    for (const u of users) {
      const ts = computeTrustScore({
        accountAgeDays: daysSince(u.createdAt),
        verificationFlags: {
          emailVerified: u.emailVerifiedAt != null,
          phoneVerified: u.phoneVerifiedAt != null,
          stripeOnboardingComplete: u.stripeOnboardingComplete === true,
          brokerLicenseVerified: u.brokerVerifications[0]?.verificationStatus === "VERIFIED",
        },
      });
      if (trustFlags.trustRankingV1) {
        rankingBoost.set(u.id, computeVisibilityImpact(ts).rankingBoost);
      }
      if (trustFlags.trustBadgesV1) {
        const b = computeTrustBadges(ts, null, null, {
          persona: "seller",
          emailVerified: u.emailVerifiedAt != null,
          phoneVerified: u.phoneVerifiedAt != null,
          stripeOnboardingComplete: u.stripeOnboardingComplete === true,
          brokerLicenseVerified: u.brokerVerifications[0]?.verificationStatus === "VERIFIED",
        });
        badges.set(u.id, b);
      }
    }
    return { rankingBoost, badges };
  } catch {
    return { rankingBoost, badges };
  }
}
