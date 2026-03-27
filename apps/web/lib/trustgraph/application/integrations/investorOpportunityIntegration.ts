import { prisma } from "@/lib/db";
import { isTrustGraphEnabled } from "@/lib/trustgraph/config";
import { isTrustGraphInvestorFiltersEnabled } from "@/lib/trustgraph/feature-flags";
import { classifyVerifiedOpportunity } from "@/lib/trustgraph/infrastructure/services/verifiedOpportunityService";
import { recordPlatformEvent } from "@/lib/observability";

export async function getInvestorOpportunityClassificationForListing(listingId: string) {
  if (!isTrustGraphEnabled() || !isTrustGraphInvestorFiltersEnabled()) {
    return { enabled: false as const, classification: null };
  }

  const c = await prisma.verificationCase.findFirst({
    where: { entityType: "LISTING", entityId: listingId },
    orderBy: { updatedAt: "desc" },
    select: { overallScore: true, trustLevel: true, readinessLevel: true },
  });

  const classification = classifyVerifiedOpportunity({ caseRow: c });

  void recordPlatformEvent({
    eventType: "trustgraph_investor_opportunity_classification",
    sourceModule: "trustgraph",
    entityType: "LISTING",
    entityId: listingId,
    payload: {
      isVerifiedOpportunity: classification.isVerifiedOpportunity,
    },
  }).catch(() => {});

  return { enabled: true as const, classification };
}
