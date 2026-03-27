import { prisma } from "@/lib/db";

export type TrustgraphAggregateMetrics = {
  verifiedOrHighTrustListingProfiles: number;
  trustProfilesTotal: number;
  brokerProfilesVerified: number;
  sellerDeclarationCasesPartialOrAction: number;
  mortgageCasesReady: number;
  mortgageCasesTotal: number;
  bnhubBookingCasesManualReviewHint: number;
  bnhubBookingCasesTotal: number;
};

/**
 * Aggregate-only metrics for admin dashboards — no PII.
 */
export async function computeTrustgraphAggregateMetrics(): Promise<TrustgraphAggregateMetrics> {
  const [
    verifiedOrHighTrustListingProfiles,
    trustProfilesTotal,
    brokerProfilesVerified,
    sellerDeclarationCasesPartialOrAction,
    mortgageCasesReady,
    mortgageCasesTotal,
    bnhubBookingCasesManualReviewHint,
    bnhubBookingCasesTotal,
  ] = await Promise.all([
    prisma.trustProfile.count({
      where: {
        subjectType: "listing",
        OR: [{ trustScore: { gte: 72 } }, { qualityScore: { gte: 80 } }],
      },
    }),
    prisma.trustProfile.count({ where: { subjectType: "listing" } }),
    prisma.trustProfile.count({
      where: { subjectType: "broker", trustScore: { gte: 70 } },
    }),
    prisma.verificationCase.count({
      where: {
        entityType: "SELLER_DECLARATION",
        readinessLevel: { in: ["partial", "action_required"] },
      },
    }),
    prisma.verificationCase.count({
      where: { entityType: "MORTGAGE_FILE", readinessLevel: "ready" },
    }),
    prisma.verificationCase.count({ where: { entityType: "MORTGAGE_FILE" } }),
    prisma.verificationCase.count({
      where: {
        entityType: "BOOKING",
        OR: [{ readinessLevel: "partial" }, { readinessLevel: "action_required" }],
      },
    }),
    prisma.verificationCase.count({ where: { entityType: "BOOKING" } }),
  ]);

  return {
    verifiedOrHighTrustListingProfiles,
    trustProfilesTotal,
    brokerProfilesVerified,
    sellerDeclarationCasesPartialOrAction,
    mortgageCasesReady,
    mortgageCasesTotal,
    bnhubBookingCasesManualReviewHint,
    bnhubBookingCasesTotal,
  };
}
