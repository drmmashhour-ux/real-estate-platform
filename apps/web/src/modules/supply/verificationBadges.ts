import type { BrokerStatus, ListingVerificationStatus, VerificationStatus } from "@prisma/client";

export type SupplyBadge =
  | "broker_verified"
  | "broker_pending"
  | "host_trust_tier"
  | "property_verified"
  | "property_pending"
  | "lecipm_exclusive";

export type ListingBadgeContext = {
  brokerStatus?: BrokerStatus | null;
  listingVerificationStatus: ListingVerificationStatus;
  verificationStatus: VerificationStatus;
  exclusiveExperienceTag: boolean;
};

/**
 * Derive merchandising badges for cards and SERP snippets (supply + trust).
 */
export function getSupplyBadgesForListing(ctx: ListingBadgeContext): SupplyBadge[] {
  const badges: SupplyBadge[] = [];
  if (ctx.brokerStatus === "VERIFIED") badges.push("broker_verified");
  else if (ctx.brokerStatus === "PENDING") badges.push("broker_pending");

  if (ctx.listingVerificationStatus === "VERIFIED" || ctx.verificationStatus === "VERIFIED") {
    badges.push("property_verified");
  } else if (
    ctx.listingVerificationStatus === "PENDING_VERIFICATION" ||
    ctx.listingVerificationStatus === "PENDING_DOCUMENTS" ||
    ctx.verificationStatus === "PENDING"
  ) {
    badges.push("property_pending");
  }

  if (ctx.exclusiveExperienceTag) badges.push("lecipm_exclusive");
  return badges;
}

export function hostTrustBadgeLabel(trustScore: number | null | undefined): SupplyBadge | null {
  if (trustScore == null) return null;
  if (trustScore >= 70) return "host_trust_tier";
  return null;
}
