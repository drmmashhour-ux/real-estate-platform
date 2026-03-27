import { prisma } from "@/lib/db";
import {
  isTrustGraphAntifraudGraphEnabled,
  isTrustGraphDocExtractionEnabled,
  isTrustGraphEnabled,
  isTrustGraphGeospatialValidationEnabled,
  isTrustGraphMediaClassificationEnabled,
} from "@/lib/trustgraph/feature-flags";
import type { Phase6ListingEvidence } from "@/lib/trustgraph/domain/types";
import { validateAndPersistGeospatialForListing } from "@/lib/trustgraph/infrastructure/services/geospatialConsistencyService";
import { summarizeMediaClassificationForListing } from "@/lib/trustgraph/infrastructure/services/mediaVerificationEvidenceService";

export async function loadPhase6ListingEvidence(listingId: string): Promise<Phase6ListingEvidence> {
  if (!isTrustGraphEnabled()) {
    return { enabled: false };
  }

  const anyOn =
    isTrustGraphDocExtractionEnabled() ||
    isTrustGraphGeospatialValidationEnabled() ||
    isTrustGraphMediaClassificationEnabled() ||
    isTrustGraphAntifraudGraphEnabled();

  if (!anyOn) {
    return { enabled: false };
  }

  const base: Phase6ListingEvidence = { enabled: true };

  if (isTrustGraphGeospatialValidationEnabled()) {
    const g = await validateAndPersistGeospatialForListing(listingId);
    base.geospatial = {
      precisionScore: g.precisionScore,
      cityMatch: g.cityMatch,
      warnings: g.warnings,
    };
  }

  if (isTrustGraphDocExtractionEnabled()) {
    const latest = await prisma.trustgraphExtractedDocumentRecord.findFirst({
      where: { job: { fsboListingId: listingId } },
      orderBy: { updatedAt: "desc" },
      select: {
        confidence: true,
        normalizedPayload: true,
        extractionStatus: true,
      },
    });
    const np = latest?.normalizedPayload as { propertyTypeHint?: string } | null | undefined;
    base.extraction = {
      normalizedPropertyType: np?.propertyTypeHint ?? null,
      confidence: latest?.confidence ?? 0,
      reviewNeeded:
        (latest?.extractionStatus === "needs_review" || (latest?.confidence ?? 0) < 0.45) ?? false,
    };
  }

  if (isTrustGraphMediaClassificationEnabled()) {
    base.media = await summarizeMediaClassificationForListing(listingId);
  }

  if (isTrustGraphAntifraudGraphEnabled()) {
    const dup = await prisma.mediaContentFingerprint.findMany({
      where: { fsboListingId: listingId },
      select: { sha256: true },
    });
    const hashes = [...new Set(dup.map((d) => d.sha256))];
    let cross = 0;
    if (hashes.length > 0) {
      cross = await prisma.mediaContentFingerprint.count({
        where: {
          sha256: { in: hashes },
          NOT: { fsboListingId: listingId },
        },
      });
    }
    const listing = await prisma.fsboListing.findUnique({
      where: { id: listingId },
      select: { contactPhone: true, contactEmail: true },
    });
    let contactReuseSignals = 0;
    if (listing?.contactPhone) {
      contactReuseSignals += await prisma.fsboListing.count({
        where: { contactPhone: listing.contactPhone, NOT: { id: listingId } },
      });
    }
    if (listing?.contactEmail) {
      contactReuseSignals += await prisma.fsboListing.count({
        where: { contactEmail: listing.contactEmail, NOT: { id: listingId } },
      });
    }
    base.antifraud = {
      duplicateHashCount: cross,
      contactReuseSignals,
    };
  }

  return base;
}
