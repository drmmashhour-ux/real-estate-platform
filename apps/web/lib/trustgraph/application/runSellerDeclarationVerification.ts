import { prisma } from "@/lib/db";
import { recordPlatformEvent } from "@/lib/observability";
import { persistVerificationCaseRun } from "@/lib/trustgraph/application/persistVerificationCaseRun";
import { collectSellerDeclarationOnlyResults } from "@/lib/trustgraph/infrastructure/rules/listingRulesRegistry";
import { buildFsboListingRuleContextFromListing } from "@/lib/trustgraph/infrastructure/services/evidenceBuilder";

/**
 * Seller declaration–only rule pack. `entityId` on the case must be the FSBO listing id.
 */
export async function runSellerDeclarationVerification(args: {
  caseId: string;
  listingId: string;
  actorUserId?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const listing = await prisma.fsboListing.findUnique({
    where: { id: args.listingId },
    include: { owner: { select: { sellerPlan: true } } },
  });
  if (!listing) return { ok: false, error: "Listing not found" };

  const ctx = buildFsboListingRuleContextFromListing(listing);
  const results = collectSellerDeclarationOnlyResults(ctx);

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
      mode: "seller_declaration",
      listingId: args.listingId,
      overallScore: outcome.overallScore,
      trustLevel: outcome.trustLevel,
      readinessLevel: outcome.readinessLevel,
      actorUserId: args.actorUserId ?? null,
    },
  }).catch(() => {});

  return { ok: true };
}
