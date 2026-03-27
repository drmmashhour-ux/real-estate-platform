import { VerificationEntityType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isTrustGraphEnabled } from "@/lib/trustgraph/config";
import { migrateLegacySellerDeclaration, declarationSectionCounts } from "@/lib/fsbo/seller-declaration-schema";
import { FSBO_HUB_REQUIRED_DOC_TYPES } from "@/lib/fsbo/seller-hub-doc-types";
import type { DealAnalyzerListingInput } from "@/modules/deal-analyzer/domain/types";

function documentCompletenessRatio(docs: { docType: string; fileUrl: string | null }[]): number {
  const ok = FSBO_HUB_REQUIRED_DOC_TYPES.filter((t) => {
    const row = docs.find((d) => d.docType === t);
    return Boolean(row?.fileUrl?.trim());
  }).length;
  return ok / Math.max(1, FSBO_HUB_REQUIRED_DOC_TYPES.length);
}

function declarationCompletenessRatio(listing: {
  sellerDeclarationJson: unknown;
  propertyType: string | null;
}): number {
  const data = migrateLegacySellerDeclaration(listing.sellerDeclarationJson);
  const { completed, total } = declarationSectionCounts(data, listing.propertyType);
  if (total <= 0) return 0;
  return completed / total;
}

export async function buildDealAnalyzerListingInput(listingId: string): Promise<DealAnalyzerListingInput | null> {
  const listing = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    include: { documents: { select: { docType: true, fileUrl: true } } },
  });
  if (!listing) return null;

  const now = Date.now();
  const ageMs = now - listing.updatedAt.getTime();
  const listingAgeDays = Math.max(0, Math.floor(ageMs / (86_400_000)));

  let caseTrustLevel: string | null = null;
  let caseReadinessLevel: string | null = null;
  let hasVerificationCase = false;

  if (isTrustGraphEnabled()) {
    const c = await prisma.verificationCase.findFirst({
      where: { entityType: VerificationEntityType.LISTING, entityId: listingId },
      orderBy: { updatedAt: "desc" },
      select: { trustLevel: true, readinessLevel: true },
    });
    if (c) {
      hasVerificationCase = true;
      caseTrustLevel = c.trustLevel != null ? String(c.trustLevel) : null;
      caseReadinessLevel = c.readinessLevel != null ? String(c.readinessLevel) : null;
    }
  }

  return {
    listingId,
    priceCents: listing.priceCents,
    surfaceSqft: listing.surfaceSqft,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    city: listing.city,
    propertyType: listing.propertyType,
    trustScore: listing.trustScore,
    riskScore: listing.riskScore,
    listingAgeDays,
    documentCompleteness: documentCompletenessRatio(listing.documents),
    declarationCompleteness: declarationCompletenessRatio(listing),
    caseTrustLevel,
    caseReadinessLevel,
    hasVerificationCase,
  };
}
