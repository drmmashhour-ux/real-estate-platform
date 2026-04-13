import type { PlatformTrustTier } from "@prisma/client";
import { VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export type PublicTrustBadge = {
  id: string;
  label: string;
  /** Stable key for styling / analytics */
  kind: string;
};

/**
 * Badges derived only from persisted signals (no fabricated claims).
 */
export async function getPublicBadgesForUser(userId: string): Promise<PublicTrustBadge[]> {
  const [profile, trust, hostBadges, identity] = await Promise.all([
    prisma.userVerificationProfile.findUnique({ where: { userId } }),
    prisma.platformTrustScore.findUnique({
      where: { entityType_entityId: { entityType: "user", entityId: userId } },
    }),
    prisma.hostBadge.findMany({ where: { hostId: userId }, select: { badgeType: true } }),
    prisma.identityVerification.findUnique({
      where: { userId },
      select: { verificationStatus: true },
    }),
  ]);

  const out: PublicTrustBadge[] = [];

  if (profile?.emailVerified) out.push({ id: "email", label: "Email verified", kind: "email_verified" });
  if (profile?.phoneVerified) out.push({ id: "phone", label: "Phone verified", kind: "phone_verified" });
  if (identity?.verificationStatus === VerificationStatus.VERIFIED) {
    out.push({ id: "identity", label: "ID verified", kind: "identity_verified" });
  }
  if (profile?.brokerVerified) {
    out.push({ id: "broker", label: "Verified broker", kind: "verified_broker" });
  }
  if (profile?.paymentVerified) {
    out.push({ id: "payout", label: "Payout ready", kind: "payment_verified" });
  }

  for (const b of hostBadges) {
    if (b.badgeType === "fast_responder") {
      out.push({ id: "fast", label: "Fast responder", kind: "fast_responder" });
    }
    if (b.badgeType === "reliable_host") {
      out.push({ id: "reliable", label: "Reliable host", kind: "reliable_host" });
    }
  }

  if (trust && (trust.level === "trusted" || trust.level === "high")) {
    out.push({ id: "trusted_user", label: "Trusted member", kind: "trusted_member" });
  }

  return dedupeBadges(out);
}

export async function getPublicBadgesForListing(listingId: string, ownerId: string): Promise<{
  listingBadges: PublicTrustBadge[];
  hostBadges: PublicTrustBadge[];
  listingTrust?: { score: number; level: PlatformTrustTier };
  hostTrust?: { score: number; level: PlatformTrustTier };
}> {
  const [lv, lt, ht, hostBadgeList] = await Promise.all([
    prisma.listingVerification.findUnique({ where: { listingId } }),
    prisma.platformTrustScore.findUnique({
      where: { entityType_entityId: { entityType: "listing", entityId: listingId } },
    }),
    prisma.platformTrustScore.findUnique({
      where: { entityType_entityId: { entityType: "host", entityId: ownerId } },
    }),
    prisma.hostBadge.findMany({ where: { hostId: ownerId }, select: { badgeType: true } }),
  ]);

  const listingBadges: PublicTrustBadge[] = [];
  if (lv?.contentReviewed && (lv.contactVerified || lv.addressVerified)) {
    listingBadges.push({ id: "lv", label: "Verified listing", kind: "verified_listing" });
  } else if (lv?.verificationLevel === "full") {
    listingBadges.push({ id: "lv_full", label: "Verified listing", kind: "verified_listing" });
  }

  if (lt && lt.level === "trusted") {
    listingBadges.push({ id: "lt_top", label: "Top trust listing", kind: "trusted_listing" });
  }

  const hostBadges: PublicTrustBadge[] = [];
  for (const b of hostBadgeList) {
    if (b.badgeType === "fast_responder") {
      hostBadges.push({ id: "h_fast", label: "Fast responder", kind: "fast_responder" });
    }
    if (b.badgeType === "reliable_host") {
      hostBadges.push({ id: "h_rel", label: "Reliable host", kind: "reliable_host" });
    }
  }
  if (ht?.level === "trusted" || ht?.level === "high") {
    hostBadges.push({ id: "h_trust", label: "Trusted host", kind: "verified_host" });
  }

  return {
    listingBadges: dedupeBadges(listingBadges),
    hostBadges: dedupeBadges(hostBadges),
    listingTrust: lt ? { score: lt.score, level: lt.level } : undefined,
    hostTrust: ht ? { score: ht.score, level: ht.level } : undefined,
  };
}

function dedupeBadges(b: PublicTrustBadge[]): PublicTrustBadge[] {
  const seen = new Set<string>();
  return b.filter((x) => {
    if (seen.has(x.kind)) return false;
    seen.add(x.kind);
    return true;
  });
}
