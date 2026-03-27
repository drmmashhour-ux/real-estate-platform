import { prisma } from "@/lib/db";
import { recordPlatformEvent } from "@/lib/observability";
import { getPhase6MoatConfig } from "@/lib/trustgraph/config/phase6-moat";
import { isTrustGraphDocExtractionEnabled, isTrustGraphEnabled } from "@/lib/trustgraph/feature-flags";
import { runMortgageFileExtractionPipeline, runSellerDocumentExtractionPipeline } from "@/lib/trustgraph/infrastructure/services/documentExtractionService";

/**
 * Re-run extraction for jobs whose engine version differs (admin/batch).
 */
export async function reprocessStaleDocumentExtractionJobs(args: { limit?: number } = {}) {
  if (!isTrustGraphEnabled() || !isTrustGraphDocExtractionEnabled()) {
    return { reprocessed: 0, skipped: true as const };
  }

  const targetVersion = getPhase6MoatConfig().extraction.engineVersion;
  const jobs = await prisma.trustgraphExtractionJob.findMany({
    where: { NOT: { modelVersion: targetVersion } },
    take: args.limit ?? 25,
    select: { id: true, sourceKind: true, sourceId: true, fsboListingId: true, mortgageFileId: true },
  });

  let reprocessed = 0;
  for (const j of jobs) {
    if (j.sourceKind === "seller_supporting_document" && j.fsboListingId) {
      const doc = await prisma.sellerSupportingDocument.findUnique({ where: { id: j.sourceId } });
      if (doc) {
        await runSellerDocumentExtractionPipeline({
          fsboListingId: doc.fsboListingId,
          sellerDocumentId: doc.id,
          storageRef: doc.storagePath,
          category: doc.category,
          fileName: doc.originalFileName,
        });
        reprocessed += 1;
      }
    }
    if (j.sourceKind === "mortgage_request" && j.mortgageFileId) {
      await runMortgageFileExtractionPipeline({ mortgageRequestId: j.mortgageFileId });
      reprocessed += 1;
    }
  }

  void recordPlatformEvent({
    eventType: "trustgraph_extraction_reprocess_batch",
    sourceModule: "trustgraph",
    entityType: "EXTRACTION_JOB",
    entityId: "batch",
    payload: { reprocessed, targetVersion },
  }).catch(() => {});

  return { reprocessed, skipped: false as const };
}
