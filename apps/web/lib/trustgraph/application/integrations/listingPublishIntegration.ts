import { prisma } from "@/lib/db";
import { recordPlatformEvent } from "@/lib/observability";
import {
  DUPLICATE_MEDIA_BLOCKS_PUBLISH,
  PREMIUM_PUBLISH_MIN_TRUST_LEVELS,
  PUBLISH_BLOCKING_RULE_CODES,
} from "@/lib/trustgraph/config/listing-rules-config";
import { syncTrustGraphForFsboListing } from "@/lib/trustgraph/integration/fsboListing";
import { isTrustGraphEnabled } from "@/lib/trustgraph/config";
import type { VerificationRuleResult } from "@prisma/client";

export type ListingPublishTrustIssue = {
  ruleCode: string;
  ruleVersion: string;
  passed: boolean;
  kind: "blocking" | "warning";
  message: string;
};

export type ListingPublishTrustGateResult =
  | { ok: true; caseId: string | null; warnings: ListingPublishTrustIssue[] }
  | {
      ok: false;
      caseId: string | null;
      blocking: ListingPublishTrustIssue[];
      warnings: ListingPublishTrustIssue[];
      userMessage: string;
    };

function isBlockingRuleCode(ruleCode: string): boolean {
  if (PUBLISH_BLOCKING_RULE_CODES.includes(ruleCode)) return true;
  if (ruleCode === "DUPLICATE_MEDIA_HASH_RULE" && DUPLICATE_MEDIA_BLOCKS_PUBLISH) return true;
  return false;
}

function classifyRule(r: VerificationRuleResult): ListingPublishTrustIssue {
  const blocking = !r.passed && isBlockingRuleCode(r.ruleCode);
  const details = (r.details ?? {}) as Record<string, unknown>;
  const msg =
    typeof details.message === "string" && details.message.trim()
      ? String(details.message)
      : !r.passed
        ? `Rule ${r.ruleCode} did not pass`
        : `${r.ruleCode} passed`;
  return {
    ruleCode: r.ruleCode,
    ruleVersion: r.ruleVersion,
    passed: r.passed,
    kind: blocking ? "blocking" : "warning",
    message: msg,
  };
}

/**
 * Maps persisted rule rows to blocking vs warning-only issues for publish UX.
 * Exported for tests and admin tooling.
 */
export function mapListingPublishRulesToIssues(rules: VerificationRuleResult[]): {
  blocking: ListingPublishTrustIssue[];
  warnings: ListingPublishTrustIssue[];
} {
  const blocking: ListingPublishTrustIssue[] = [];
  const warnings: ListingPublishTrustIssue[] = [];
  for (const r of rules) {
    if (r.passed) continue;
    const issue = classifyRule(r);
    if (issue.kind === "blocking") blocking.push(issue);
    else warnings.push(issue);
  }
  return { blocking, warnings };
}

export type FsboPublishPlan = "basic" | "premium";

/**
 * Runs listing verification and evaluates publish eligibility for checkout / activation.
 * Does not replace draft saves — call only on publish/activation paths.
 */
export async function assertListingPublishTrustGate(args: {
  listingId: string;
  actorUserId: string;
  publishPlan: FsboPublishPlan;
}): Promise<ListingPublishTrustGateResult> {
  if (!isTrustGraphEnabled()) {
    return { ok: true, caseId: null, warnings: [] };
  }

  const sync = await syncTrustGraphForFsboListing({
    listingId: args.listingId,
    actorUserId: args.actorUserId,
    runPipeline: true,
  });
  if (sync.skipped) {
    return { ok: true, caseId: null, warnings: [] };
  }

  const caseRow = await prisma.verificationCase.findFirst({
    where: { entityType: "LISTING", entityId: args.listingId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, trustLevel: true },
  });
  const caseId = caseRow?.id ?? sync.caseId ?? null;

  const rules = caseId
    ? await prisma.verificationRuleResult.findMany({
        where: { caseId },
        orderBy: { createdAt: "asc" },
      })
    : [];

  const { blocking, warnings } = mapListingPublishRulesToIssues(rules);

  if (args.publishPlan === "premium") {
    const tl = caseRow?.trustLevel ?? null;
    if (!tl || !PREMIUM_PUBLISH_MIN_TRUST_LEVELS.has(tl)) {
      blocking.push({
        ruleCode: "PREMIUM_TRUST_THRESHOLD",
        ruleVersion: "1",
        passed: false,
        kind: "blocking",
        message: "Premium listing publish requires a higher trust score. Address listing issues and verification readiness first.",
      });
    }
  }

  if (blocking.length > 0) {
    const userMessage = [
      "Listing cannot be published until the following trust checks pass:",
      ...blocking.map((b) => `• ${b.message}`),
    ].join(" ");

    void recordPlatformEvent({
      eventType: "trustgraph_publish_blocked",
      sourceModule: "trustgraph",
      entityType: "FSBO_LISTING",
      entityId: args.listingId,
      payload: {
        publishPlan: args.publishPlan,
        blockingRuleCodes: blocking.map((b) => b.ruleCode),
        caseId,
      },
    }).catch(() => {});

    return {
      ok: false,
      caseId,
      blocking,
      warnings,
      userMessage,
    };
  }

  return { ok: true, caseId, warnings };
}
