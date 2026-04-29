import "server-only";

import { prisma } from "@/lib/db";
import { computeListingAiScores, type ListingAiScoresResult } from "@/lib/fsbo/listing-ai-scores";
import { migrateLegacySellerDeclaration } from "@/lib/fsbo/seller-declaration-schema";
import {
  analyzeSellerDeclarationForReview,
  type SellerDeclarationAiReview,
} from "@/lib/fsbo/seller-declaration-ai-review.logic";

const DECLARATION_AI_RISK_TYPE = "DECLARATION_AI_HIGH";

/**
 * Persists latest rules-based review, risk/trust scores, and raises a single admin alert when HIGH risk is present.
 * Does not block publishing or change listing status.
 */
export async function persistSellerDeclarationAiReview(
  listingId: string
): Promise<{ review: SellerDeclarationAiReview; scores: ListingAiScoresResult } | null> {
  const listing = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    include: {
      documents: true,
      sellerSupportingDocuments: { select: { category: true, status: true } },
      verification: true,
    },
  });
  if (!listing) return null;

  const declaration = migrateLegacySellerDeclaration(listing.sellerDeclarationJson ?? null);
  const review = analyzeSellerDeclarationForReview({
    declaration,
    listingDescription: listing.description ?? "",
    hubDocuments: listing.documents.map((d) => ({ docType: d.docType, fileUrl: d.fileUrl })),
    supportingDocuments: listing.sellerSupportingDocuments,
    propertyType: listing.propertyType,
  });

  const scores = computeListingAiScores({
    declaration,
    review,
    hubDocuments: listing.documents.map((d) => ({ docType: d.docType, fileUrl: d.fileUrl })),
    supportingDocuments: listing.sellerSupportingDocuments,
    verification: listing.verification,
    sellerDeclarationJson: listing.sellerDeclarationJson,
    sellerDeclarationCompletedAt: listing.sellerDeclarationCompletedAt,
    propertyType: listing.propertyType,
  });

  await prisma.$transaction(async (tx) => {
    await tx.fsboListing.update({
      where: { id: listingId },
      data: {
        sellerDeclarationAiReviewJson: review as object,
        riskScore: scores.riskScore,
        trustScore: scores.trustScore,
        aiScoreReasonsJson: scores.reasons as object,
      },
    });
    await tx.listingAiScore.create({
      data: {
        fsboListingId: listingId,
        riskScore: scores.riskScore,
        trustScore: scores.trustScore,
        reasons: scores.reasons as object,
      },
    });
  });

  await prisma.riskAlert.deleteMany({
    where: { fsboListingId: listingId, riskType: DECLARATION_AI_RISK_TYPE },
  });

  if (review.hasHighRisk) {
    const highLabels = review.keywordsMatched
      .filter((k) => k.severity === "HIGH")
      .map((k) => k.label)
      .slice(0, 8);
    const msg =
      highLabels.length > 0
        ? `Seller declaration keyword scan (HIGH): ${highLabels.join(", ")}. Listing ${listing.listingCode ?? listingId}.`
        : `Seller declaration review flagged HIGH severity topics. Listing ${listing.listingCode ?? listingId}.`;

    await prisma.riskAlert.create({
      data: {
        userId: listing.ownerId,
        fsboListingId: listingId,
        riskType: DECLARATION_AI_RISK_TYPE,
        message: msg,
        severity: "HIGH",
      },
    });
  }

  return { review, scores };
}
