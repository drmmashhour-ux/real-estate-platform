import { prisma } from "@/lib/db";
import { buildFsboListingRuleContextFromListing } from "@/lib/trustgraph/infrastructure/services/evidenceBuilder";
import { collectSellerDeclarationOnlyResults } from "@/lib/trustgraph/infrastructure/rules/listingRulesRegistry";
import { isTrustGraphEnabled } from "@/lib/trustgraph/config";
import { syncTrustGraphForFsboListing } from "@/lib/trustgraph/integration/fsboListing";

export type SellerDeclarationReadinessSafeDto = {
  completionPercent: number;
  readinessLabel: string;
  blockingIssuesCount: number;
  contradictionCount: number;
  failedRuleCodes: string[];
  passed: boolean;
};

function percentFromDeclarationRules(passedCount: number, total: number): number {
  if (total <= 0) return 100;
  return Math.round((passedCount / total) * 100);
}

/**
 * Deterministic declaration-only evaluation (no DB read of signals). Safe for seller UI copy.
 */
export async function computeSellerDeclarationReadinessFromListing(args: {
  listingId: string;
}): Promise<SellerDeclarationReadinessSafeDto | null> {
  if (!isTrustGraphEnabled()) return null;

  const listing = await prisma.fsboListing.findUnique({
    where: { id: args.listingId },
    include: { owner: { select: { sellerPlan: true } } },
  });
  if (!listing) return null;

  const ctx = buildFsboListingRuleContextFromListing(listing);
  const results = collectSellerDeclarationOnlyResults(ctx);

  const failed = results.filter((r) => !r.passed);
  const contradiction = failed.filter((r) => r.ruleCode === "DECLARATION_CONTRADICTION_RULE");
  const pct = percentFromDeclarationRules(results.filter((r) => r.passed).length, results.length);

  return {
    completionPercent: pct,
    readinessLabel:
      failed.length === 0
        ? "Declaration verification checks passed."
        : "Complete required sections and resolve issues before submission.",
    blockingIssuesCount: failed.length,
    contradictionCount: contradiction.length,
    failedRuleCodes: failed.map((r) => r.ruleCode),
    passed: failed.length === 0,
  };
}

/**
 * After listing hub save: rerun listing verification and return safe declaration readiness for the response payload.
 */
export async function refreshListingTrustGraphOnSave(args: { listingId: string; actorUserId: string }) {
  if (!isTrustGraphEnabled()) return null;
  await syncTrustGraphForFsboListing({
    listingId: args.listingId,
    actorUserId: args.actorUserId,
    runPipeline: true,
  });
  const declarationReadiness = await computeSellerDeclarationReadinessFromListing({ listingId: args.listingId });
  return { declarationReadiness };
}
