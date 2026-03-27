import type { BnhubTrustRiskLevel } from "@prisma/client";
import { prisma } from "@/lib/db";
import { catalogAddonAllowedForListing, loadListingTrustContext } from "@/lib/bnhub/hospitality-addons";

const TRUST_RANK: Record<string, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };

function trustRiskAtLeast(
  current: BnhubTrustRiskLevel | null,
  min: string | undefined
): boolean {
  if (!min || !current) return false;
  return (TRUST_RANK[current] ?? 0) >= (TRUST_RANK[min] ?? 99);
}

export type ServiceGate = { allowed: true } | { allowed: false; reason: string; publicMessageKey?: string };

/** Validates catalog service can be attached to listing (premium + trust + moderation). */
export async function validateServiceForListing(args: { listingId: string; serviceId: string }): Promise<ServiceGate> {
  const [service, trust, listing] = await Promise.all([
    prisma.bnhubService.findUnique({ where: { id: args.serviceId } }),
    loadListingTrustContext(args.listingId),
    prisma.shortTermListing.findUnique({
      where: { id: args.listingId },
      select: { ownerId: true, verificationStatus: true },
    }),
  ]);
  if (!service?.isActive) return { allowed: false, reason: "Service inactive", publicMessageKey: "unavailable" };
  if (
    !catalogAddonAllowedForListing({
      isPremiumTier: service.isPremiumTier,
      minListingTrustScore: service.minListingTrustScore,
      listingTrustScore: trust.trustScore,
      overallRiskLevel: trust.overallRiskLevel,
    })
  ) {
    return {
      allowed: false,
      reason: "Premium or trust-gated service not available for this listing",
      publicMessageKey: "unavailable_for_this_stay",
    };
  }

  const rules = await prisma.bnhubHospitalitySafetyRule.findMany({
    where: { isEnabled: true, OR: [{ scopeType: "GLOBAL" }, { scopeType: "LISTING", scopeId: args.listingId }] },
    orderBy: { priority: "desc" },
  });
  for (const r of rules) {
    if (r.serviceCode && r.serviceCode !== service.serviceCode) continue;
    if (r.category && r.category !== service.category) continue;
    const conditions = r.conditionsJson as { trustRiskAtLeast?: string } | null;
    if (conditions?.trustRiskAtLeast && !trustRiskAtLeast(trust.overallRiskLevel, conditions.trustRiskAtLeast)) {
      continue;
    }
    const actions = r.actionsJson as {
      block?: boolean;
      blockPremiumCatalog?: boolean;
      message?: string;
    } | null;
    if (actions?.block) {
      return { allowed: false, reason: actions.message ?? "Restricted by policy", publicMessageKey: "restricted" };
    }
    if (actions?.blockPremiumCatalog && service.isPremiumTier) {
      return {
        allowed: false,
        reason: actions.message ?? "Premium add-ons restricted for this listing",
        publicMessageKey: "unavailable_for_this_stay",
      };
    }
  }

  if (service.serviceScope === "PARTNER_MANAGED") {
    return { allowed: true };
  }

  return { allowed: true };
}

export async function applySafetyRestrictions(listingId: string): Promise<{ blockedPremium: boolean }> {
  const trust = await loadListingTrustContext(listingId);
  const risk: BnhubTrustRiskLevel | null = trust.overallRiskLevel;
  const blockedPremium = risk === "HIGH" || risk === "CRITICAL";
  return { blockedPremium };
}

export async function checkHostEligibilityForPremiumServices(hostUserId: string): Promise<boolean> {
  const iv = await prisma.identityVerification.findUnique({
    where: { userId: hostUserId },
    select: { verificationStatus: true },
  });
  return iv?.verificationStatus === "VERIFIED";
}

export async function checkListingSafetyEligibility(listingId: string): Promise<{ bookingAllowed: boolean }> {
  const profile = await prisma.bnhubListingSafetyProfile.findUnique({
    where: { listingId },
    select: { bookingAllowed: true },
  });
  return { bookingAllowed: profile?.bookingAllowed !== false };
}

export async function createModerationBlocker(
  listingServiceId: string,
  status: "RESTRICTED" | "SUSPENDED" | "PENDING_REVIEW"
) {
  return prisma.bnhubListingService.update({
    where: { id: listingServiceId },
    data: { moderationStatus: status },
  });
}

export async function listServiceRestrictionsForHost(hostUserId: string) {
  return prisma.bnhubListingService.findMany({
    where: {
      listing: { ownerId: hostUserId },
      OR: [{ moderationStatus: { not: "APPROVED" } }, { adminDisabled: true }],
    },
    include: { service: true, listing: { select: { id: true, title: true } } },
  });
}
