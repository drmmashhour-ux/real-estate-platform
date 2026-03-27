import { prisma } from "@/lib/db";
import type { ExternalBrokerTrustDto, ExternalListingTrustDto, ExternalMortgageReadinessDto } from "@/lib/trustgraph/domain/externalApi";

export async function getExternalListingTrustSanitized(listingId: string): Promise<ExternalListingTrustDto | null> {
  const listing = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: { id: true },
  });
  if (!listing) return null;

  const c = await prisma.verificationCase.findFirst({
    where: { entityType: "LISTING", entityId: listingId },
    orderBy: { updatedAt: "desc" },
    select: { trustLevel: true, readinessLevel: true },
  });

  const badges: string[] = [];
  if (c?.trustLevel === "verified") badges.push("verified");
  else if (c?.trustLevel === "high") badges.push("high_trust");

  const missing: string[] = [];
  if (c?.readinessLevel === "action_required") missing.push("verification_follow_up");

  return {
    listingId,
    trustLevel: c?.trustLevel ?? null,
    readinessLevel: c?.readinessLevel ?? null,
    badges,
    missingItemsSummary: missing,
  };
}

export async function getExternalMortgageReadinessSanitized(mortgageRequestId: string): Promise<ExternalMortgageReadinessDto | null> {
  const row = await prisma.mortgageRequest.findUnique({
    where: { id: mortgageRequestId },
    select: { id: true, preApproved: true, intentLevel: true },
  });
  if (!row) return null;

  const missing: string[] = [];
  if (!row.preApproved) missing.push("pre_approval");

  return {
    mortgageRequestId: row.id,
    readinessSummary: `intent_${row.intentLevel}`,
    missingItemsSummary: missing,
  };
}

export async function getExternalBrokerTrustSanitized(brokerId: string): Promise<ExternalBrokerTrustDto | null> {
  const b = await prisma.mortgageBroker.findUnique({
    where: { id: brokerId },
    select: { id: true, isVerified: true, verificationStatus: true },
  });
  if (!b) return null;

  const missing: string[] = [];
  if (!b.isVerified) missing.push("broker_verification");

  return {
    brokerId: b.id,
    verificationLabel: b.isVerified ? "verified" : b.verificationStatus,
    missingItemsSummary: missing,
  };
}
