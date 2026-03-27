import { prisma } from "@/lib/db";
import { recordPlatformEvent } from "@/lib/observability";
import { getPhase6MoatConfig } from "@/lib/trustgraph/config/phase6-moat";
import { isTrustGraphDocExtractionEnabled, isTrustGraphEnabled } from "@/lib/trustgraph/feature-flags";
import { normalizeMortgageFileExtraction, normalizeSellerDocumentExtraction } from "@/lib/trustgraph/infrastructure/services/extractionNormalizationService";

export async function runSellerDocumentExtractionPipeline(args: {
  fsboListingId: string;
  sellerDocumentId: string;
  storageRef: string;
  category: string;
  fileName: string;
}): Promise<{ jobId: string; recordId: string } | { skipped: true }> {
  if (!isTrustGraphEnabled() || !isTrustGraphDocExtractionEnabled()) {
    return { skipped: true };
  }

  const listing = await prisma.fsboListing.findUnique({
    where: { id: args.fsboListingId },
    select: { sellerDeclarationJson: true },
  });

  const cfg = getPhase6MoatConfig();
  const { normalized, confidence } = normalizeSellerDocumentExtraction({
    sellerDeclarationJson: listing?.sellerDeclarationJson,
    fileName: args.fileName,
    category: args.category,
  });

  const reviewNeeded = confidence < cfg.extraction.reviewRequiredBelowConfidence;
  const status = reviewNeeded ? "needs_review" : "completed";

  const job = await prisma.trustgraphExtractionJob.create({
    data: {
      sourceKind: "seller_supporting_document",
      sourceId: args.sellerDocumentId,
      fsboListingId: args.fsboListingId,
      status: reviewNeeded ? "needs_review" : "completed",
      modelVersion: cfg.extraction.engineVersion,
    },
  });

  const record = await prisma.trustgraphExtractedDocumentRecord.create({
    data: {
      jobId: job.id,
      storageRef: args.storageRef,
      documentType: args.category,
      extractionStatus: status,
      extractedPayload: { stub: true, fileName: args.fileName } as object,
      normalizedPayload: normalized as object,
      confidence,
      modelVersion: cfg.extraction.engineVersion,
    },
  });

  await prisma.trustgraphExtractedDocumentField.create({
    data: {
      recordId: record.id,
      fieldKey: "propertyTypeHint",
      fieldValue: normalized.propertyTypeHint,
      confidence,
      valueSource: "extraction",
    },
  });

  void recordPlatformEvent({
    eventType: "trustgraph_extraction_run",
    sourceModule: "trustgraph",
    entityType: "EXTRACTION_JOB",
    entityId: job.id,
    payload: {
      listingId: args.fsboListingId,
      confidence,
      reviewNeeded,
      engineVersion: cfg.extraction.engineVersion,
    },
  }).catch(() => {});

  return { jobId: job.id, recordId: record.id };
}

export async function runMortgageFileExtractionPipeline(args: { mortgageRequestId: string }): Promise<
  { jobId: string; recordId: string } | { skipped: true }
> {
  if (!isTrustGraphEnabled() || !isTrustGraphDocExtractionEnabled()) {
    return { skipped: true };
  }

  const row = await prisma.mortgageRequest.findUnique({ where: { id: args.mortgageRequestId } });
  if (!row) return { skipped: true };

  const cfg = getPhase6MoatConfig();
  const { normalized, confidence } = normalizeMortgageFileExtraction({
    income: row.income,
    employmentStatus: row.employmentStatus,
    creditRange: row.creditRange,
  });

  const reviewNeeded = confidence < cfg.extraction.reviewRequiredBelowConfidence;

  const job = await prisma.trustgraphExtractionJob.create({
    data: {
      sourceKind: "mortgage_request",
      sourceId: args.mortgageRequestId,
      mortgageFileId: args.mortgageRequestId,
      status: reviewNeeded ? "needs_review" : "completed",
      modelVersion: cfg.extraction.engineVersion,
    },
  });

  const record = await prisma.trustgraphExtractedDocumentRecord.create({
    data: {
      jobId: job.id,
      storageRef: `mortgage_request:${args.mortgageRequestId}`,
      documentType: "mortgage_intake",
      extractionStatus: reviewNeeded ? "needs_review" : "completed",
      extractedPayload: { income: row.income } as object,
      normalizedPayload: normalized as object,
      confidence,
      modelVersion: cfg.extraction.engineVersion,
    },
  });

  void recordPlatformEvent({
    eventType: "trustgraph_extraction_run",
    sourceModule: "trustgraph",
    entityType: "EXTRACTION_JOB",
    entityId: job.id,
    payload: {
      mortgageRequestId: args.mortgageRequestId,
      confidence,
      reviewNeeded,
    },
  }).catch(() => {});

  return { jobId: job.id, recordId: record.id };
}
