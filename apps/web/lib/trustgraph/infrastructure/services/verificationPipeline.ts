import { prisma } from "@/lib/db";
import { recordPlatformEvent } from "@/lib/observability";
import { persistVerificationCaseRun } from "@/lib/trustgraph/application/persistVerificationCaseRun";
import { collectFsboListingRuleResults } from "@/lib/trustgraph/infrastructure/rules/listingRulesRegistry";
import type { FsboListingRuleContext } from "@/lib/trustgraph/domain/types";
import { buildFsboListingRuleContextFromListing } from "@/lib/trustgraph/infrastructure/services/evidenceBuilder";
import { loadPhase6ListingEvidence } from "@/lib/trustgraph/infrastructure/services/phase6ListingEvidenceLoader";
import { loadPhase8ListingEvidence } from "@/lib/trustgraph/infrastructure/services/phase8ListingEvidenceLoader";
import { recordUsage } from "@/lib/trustgraph/infrastructure/services/usageTrackingService";
import { syncAntifraudGraphAfterListingPipeline } from "@/lib/trustgraph/application/integrations/antifraudGraphIntegration";

async function loadDuplicateHashesAcrossListings(listingId: string): Promise<string[]> {
  const mine = await prisma.mediaContentFingerprint.findMany({
    where: { fsboListingId: listingId },
    select: { sha256: true },
  });
  const hashes = [...new Set(mine.map((m) => m.sha256))];
  if (hashes.length === 0) return [];
  const others = await prisma.mediaContentFingerprint.findMany({
    where: {
      sha256: { in: hashes },
      NOT: { fsboListingId: listingId },
    },
    select: { sha256: true },
  });
  return [...new Set(others.map((o) => o.sha256))];
}

function duplicateImageUrlsInGallery(images: string[]): string[] {
  const seen = new Set<string>();
  const dup: string[] = [];
  for (const raw of images) {
    const u = (raw ?? "").trim();
    if (!u) continue;
    if (seen.has(u)) dup.push(u);
    else seen.add(u);
  }
  return dup;
}

export async function runFsboListingVerificationPipeline(args: {
  caseId: string;
  listingId: string;
  actorUserId?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const listing = await prisma.fsboListing.findUnique({
    where: { id: args.listingId },
    include: { owner: { select: { sellerPlan: true } } },
  });
  if (!listing) return { ok: false, error: "Listing not found" };

  const baseCtx = buildFsboListingRuleContextFromListing(listing);
  const phase6 = await loadPhase6ListingEvidence(listing.id);
  const phase8 = await loadPhase8ListingEvidence(listing.id);
  const ctx: FsboListingRuleContext = { ...baseCtx, phase6, phase8 };
  const dupCross = await loadDuplicateHashesAcrossListings(listing.id);
  const urlDupes = duplicateImageUrlsInGallery(ctx.images);

  const results = collectFsboListingRuleResults(ctx, {
    duplicateSha256AcrossOtherListings: dupCross,
    duplicateSha256WithinListing: [],
    duplicateImageUrlsWithinListing: urlDupes,
  });

  const outcome = await prisma.$transaction(async (tx) => {
    return persistVerificationCaseRun(tx, {
      caseId: args.caseId,
      results,
      trustProfile: { kind: "listing", listingId: args.listingId },
    });
  });

  void recordPlatformEvent({
    eventType: "trustgraph_pipeline_run",
    sourceModule: "trustgraph",
    entityType: "VERIFICATION_CASE",
    entityId: args.caseId,
    payload: {
      listingId: args.listingId,
      overallScore: outcome.overallScore,
      trustLevel: outcome.trustLevel,
      readinessLevel: outcome.readinessLevel,
      actorUserId: args.actorUserId ?? null,
    },
  }).catch(() => {});

  void syncAntifraudGraphAfterListingPipeline(args.listingId).catch(() => {});

  void recordUsage({
    workspaceId: null,
    usageType: "verification_run",
    quantity: 1,
    metadata: { listingId: args.listingId, caseId: args.caseId },
  }).catch(() => {});

  return { ok: true };
}
