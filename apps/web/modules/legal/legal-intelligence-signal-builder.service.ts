import { VerificationEntityType, VerificationSignalCategory } from "@prisma/client";
import { prisma } from "@/lib/db";
import { LEGAL_INTEL_DEFAULT_WINDOW_MS } from "./legal-intelligence.constants";
import type {
  LegalDocumentRow,
  LegalIntelligenceSnapshot,
  LegalSupportingDocRow,
  LegalVerificationCaseRow,
} from "./legal-intelligence.types";

export type BuildLegalIntelligenceSnapshotParams = {
  entityType: string;
  entityId: string;
  actorType: string;
  workflowType: string;
  now?: Date;
};

function emptySnapshot(p: BuildLegalIntelligenceSnapshotParams, nowIso: string): LegalIntelligenceSnapshot {
  const end = Date.parse(nowIso);
  const startMs = Number.isNaN(end) ? Date.now() - LEGAL_INTEL_DEFAULT_WINDOW_MS : end - LEGAL_INTEL_DEFAULT_WINDOW_MS;
  const windowStart = new Date(startMs).toISOString();
  return {
    builtAt: nowIso,
    windowStart,
    windowEnd: nowIso,
    entityType: p.entityType,
    entityId: p.entityId,
    actorType: p.actorType || "unknown",
    workflowType: p.workflowType || "unknown",
    fsboListingId: null,
    ownerUserId: null,
    listingOwnerType: null,
    listingStatus: null,
    moderationStatus: null,
    documents: [],
    supportingDocuments: [],
    supportingDocumentsSameUserOtherListings: [],
    verificationCases: [],
    aggregates: {
      supportingRejectedInWindow: 0,
      supportingPendingInWindow: 0,
      supportingCreatedInWindow: 0,
      supportingTotalInWindow: 0,
      slotRejectedCount: 0,
      slotPendingReviewCount: 0,
      slotMissingCriticalCount: 0,
    },
  };
}

export async function buildLegalIntelligenceSnapshot(
  params: BuildLegalIntelligenceSnapshotParams,
): Promise<LegalIntelligenceSnapshot> {
  const now = params.now ?? new Date();
  const nowIso = now.toISOString();
  const windowEndMs = now.getTime();
  const windowStartMs = windowEndMs - LEGAL_INTEL_DEFAULT_WINDOW_MS;
  const windowStartIso = new Date(windowStartMs).toISOString();

  if (params.entityType !== "fsbo_listing") {
    const sparse = emptySnapshot(params, nowIso);
    sparse.windowStart = windowStartIso;
    sparse.windowEnd = nowIso;
    return sparse;
  }

  try {
    const listing = await prisma.fsboListing.findUnique({
      where: { id: params.entityId },
      select: {
        id: true,
        ownerId: true,
        listingOwnerType: true,
        status: true,
        moderationStatus: true,
      },
    });

    if (!listing) {
      const sparse = emptySnapshot(params, nowIso);
      sparse.windowStart = windowStartIso;
      sparse.windowEnd = nowIso;
      return sparse;
    }

    const listingId = listing.id;
    const ownerId = listing.ownerId;

    const [slotDocs, supportingOnListing, supportingOtherListings, verificationCasesRaw] = await Promise.all([
      prisma.fsboListingDocument.findMany({
        where: { fsboListingId: listingId },
        select: {
          id: true,
          docType: true,
          fileName: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          fsboListingId: true,
        },
      }),
      prisma.sellerSupportingDocument.findMany({
        where: {
          fsboListingId: listingId,
          createdAt: { gte: new Date(windowStartMs) },
        },
        select: {
          id: true,
          userId: true,
          fsboListingId: true,
          originalFileName: true,
          mimeType: true,
          category: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.sellerSupportingDocument.findMany({
        where: {
          userId: ownerId,
          fsboListingId: { not: listingId },
          createdAt: { gte: new Date(windowStartMs) },
        },
        take: 500,
        select: {
          id: true,
          userId: true,
          fsboListingId: true,
          originalFileName: true,
          mimeType: true,
          category: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.verificationCase.findMany({
        where: {
          OR: [
            { entityType: VerificationEntityType.LISTING, entityId: listingId },
            { entityType: VerificationEntityType.SELLER, entityId: ownerId },
          ],
          createdAt: { gte: new Date(windowStartMs) },
        },
        take: 100,
        select: {
          id: true,
          entityType: true,
          entityId: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          overallScore: true,
          signals: {
            where: { category: VerificationSignalCategory.identity },
            select: { id: true },
          },
        },
      }),
    ]);

    const documents: LegalDocumentRow[] = slotDocs.map((d) => ({
      id: d.id,
      source: "fsbo_slot",
      docType: d.docType,
      fileName: d.fileName,
      status: d.status,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
      fsboListingId: d.fsboListingId,
    }));

    const mapSupporting = (x: (typeof supportingOnListing)[number]): LegalSupportingDocRow => ({
      id: x.id,
      userId: x.userId,
      fsboListingId: x.fsboListingId,
      originalFileName: x.originalFileName,
      mimeType: x.mimeType,
      category: x.category,
      status: x.status,
      createdAt: x.createdAt.toISOString(),
      updatedAt: x.updatedAt.toISOString(),
    });

    const supportingDocuments = supportingOnListing.map(mapSupporting);
    const supportingDocumentsSameUserOtherListings = supportingOtherListings.map(mapSupporting);

    const verificationCases: LegalVerificationCaseRow[] = verificationCasesRaw.map((c) => ({
      id: c.id,
      entityType: String(c.entityType),
      entityId: c.entityId,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      overallScore: c.overallScore,
      identitySignalCount: c.signals.length,
    }));

    let supportingRejectedInWindow = 0;
    let supportingPendingInWindow = 0;
    let supportingCreatedInWindow = 0;
    for (const s of supportingDocuments) {
      supportingCreatedInWindow += 1;
      if (s.status === "REJECTED") supportingRejectedInWindow += 1;
      if (s.status === "PENDING") supportingPendingInWindow += 1;
    }

    let slotRejectedCount = 0;
    let slotPendingReviewCount = 0;
    let slotMissingCriticalCount = 0;
    const critical = new Set(["ownership", "id_proof"]);
    for (const d of documents) {
      if (d.status === "rejected") slotRejectedCount += 1;
      if (d.status === "pending_review") slotPendingReviewCount += 1;
      if (critical.has(d.docType) && (d.status === "missing" || !d.status)) slotMissingCriticalCount += 1;
    }

    return {
      builtAt: nowIso,
      windowStart: windowStartIso,
      windowEnd: nowIso,
      entityType: params.entityType,
      entityId: params.entityId,
      actorType: params.actorType || "unknown",
      workflowType: params.workflowType || "unknown",
      fsboListingId: listingId,
      ownerUserId: ownerId,
      listingOwnerType: String(listing.listingOwnerType),
      listingStatus: listing.status,
      moderationStatus: listing.moderationStatus,
      documents,
      supportingDocuments,
      supportingDocumentsSameUserOtherListings,
      verificationCases,
      aggregates: {
        supportingRejectedInWindow,
        supportingPendingInWindow,
        supportingCreatedInWindow,
        supportingTotalInWindow: supportingDocuments.length,
        slotRejectedCount,
        slotPendingReviewCount,
        slotMissingCriticalCount,
      },
    };
  } catch {
    const sparse = emptySnapshot(params, nowIso);
    sparse.windowStart = windowStartIso;
    sparse.windowEnd = nowIso;
    return sparse;
  }
}
