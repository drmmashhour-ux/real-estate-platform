/**
 * Phase 6 TrustGraph moat demo — evidence rows for admin dashboards.
 * Run from apps/web:
 *   TRUSTGRAPH_ENABLED=true \
 *   TRUSTGRAPH_DOC_EXTRACTION_ENABLED=true \
 *   TRUSTGRAPH_GEOSPATIAL_VALIDATION_ENABLED=true \
 *   TRUSTGRAPH_MEDIA_CLASSIFICATION_ENABLED=true \
 *   TRUSTGRAPH_ANTIFRAUD_GRAPH_ENABLED=true \
 *   TRUSTGRAPH_PREMIUM_PLACEMENT_ENABLED=true \
 *   npx tsx prisma/seed-trustgraph-phase6-demo.ts
 */
import { TrustgraphFraudGraphNodeKind } from "@prisma/client";
import { prisma } from "../lib/db";
import { validateAndPersistGeospatialForListing } from "../lib/trustgraph/infrastructure/services/geospatialConsistencyService";
import { recomputeFraudGraphForListing } from "../lib/trustgraph/infrastructure/services/antifraudGraphService";

async function main() {
  const listing = await prisma.fsboListing.findFirst({
    where: { status: "ACTIVE" },
    select: { id: true },
  });
  if (listing) {
    await validateAndPersistGeospatialForListing(listing.id);
    await recomputeFraudGraphForListing(listing.id);
    console.log("Geospatial + antifraud graph for listing", listing.id);
  } else {
    console.log("No active listing — skip geo/graph demo.");
  }

  const doc = await prisma.sellerSupportingDocument.findFirst({ select: { id: true, fsboListingId: true } });
  if (doc) {
    await prisma.trustgraphExtractionJob.upsert({
      where: { id: "00000000-0000-4000-8000-000000000001" },
      create: {
        id: "00000000-0000-4000-8000-000000000001",
        sourceKind: "seller_supporting_document",
        sourceId: doc.id,
        fsboListingId: doc.fsboListingId,
        status: "completed",
        modelVersion: "demo-seed-v1",
      },
      update: { status: "completed" },
    });
    await prisma.trustgraphExtractedDocumentRecord.upsert({
      where: { jobId: "00000000-0000-4000-8000-000000000001" },
      create: {
        jobId: "00000000-0000-4000-8000-000000000001",
        storageRef: "demo://seller-doc",
        documentType: "PROPERTY",
        extractionStatus: "completed",
        confidence: 0.88,
        modelVersion: "demo-seed-v1",
        normalizedPayload: { version: "1", demo: true },
      },
      update: { confidence: 0.88 },
    });
    console.log("Seller doc extraction demo tied to", doc.id);
  }

  const mortgage = await prisma.mortgageRequest.findFirst({ select: { id: true } });
  if (mortgage) {
    await prisma.trustgraphExtractionJob.upsert({
      where: { id: "00000000-0000-4000-8000-000000000002" },
      create: {
        id: "00000000-0000-4000-8000-000000000002",
        sourceKind: "mortgage_request",
        sourceId: mortgage.id,
        mortgageFileId: mortgage.id,
        status: "needs_review",
        modelVersion: "demo-seed-v1",
      },
      update: { status: "needs_review" },
    });
    await prisma.trustgraphExtractedDocumentRecord.upsert({
      where: { jobId: "00000000-0000-4000-8000-000000000002" },
      create: {
        jobId: "00000000-0000-4000-8000-000000000002",
        storageRef: `mortgage_request:${mortgage.id}`,
        documentType: "mortgage_intake",
        extractionStatus: "needs_review",
        confidence: 0.32,
        modelVersion: "demo-seed-v1",
        normalizedPayload: { version: "1", demo: true, missingEvidence: true },
      },
      update: { confidence: 0.32 },
    });
    console.log("Mortgage extraction needs_review demo for", mortgage.id);
  }

  await prisma.trustgraphFraudGraphNode.upsert({
    where: { kind_externalId: { kind: TrustgraphFraudGraphNodeKind.listing, externalId: "demo-cluster-seed" } },
    create: {
      kind: TrustgraphFraudGraphNodeKind.listing,
      externalId: "demo-cluster-seed",
      metadata: { demo: true },
    },
    update: {},
  });

  console.log("Phase 6 seed complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
