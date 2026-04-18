/**
 * Full platform improvement bundle — advisory only; wires reviews + monitoring.
 */

import { buildPlatformClarityReview } from "./platform-clarity-review.service";
import { buildPlatformDataMoatReview } from "./platform-data-moat-review.service";
import type { PlatformImprovementBundle } from "./platform-improvement.types";
import { buildPlatformImprovementPriorities } from "./platform-improvement-priority.service";
import { recordPlatformImprovementReview } from "./platform-improvement-monitoring.service";
import { buildPlatformMonetizationReview } from "./platform-monetization-review.service";
import { buildPlatformOpsReview } from "./platform-ops-review.service";
import { getDefaultPlatformReviewSnapshot, type PlatformReviewSnapshot } from "./platform-review-snapshot";
import { buildPlatformTrustReview } from "./platform-trust-review.service";

export function buildFullPlatformImprovementBundle(
  snapshot: PlatformReviewSnapshot = getDefaultPlatformReviewSnapshot(),
): PlatformImprovementBundle {
  const clarity = buildPlatformClarityReview(snapshot);
  const monetization = buildPlatformMonetizationReview(snapshot);
  const trust = buildPlatformTrustReview(snapshot);
  const ops = buildPlatformOpsReview(snapshot);
  const dataMoat = buildPlatformDataMoatReview(snapshot);
  const priorities = buildPlatformImprovementPriorities({
    clarity,
    monetization,
    trust,
    ops,
    dataMoat,
    snapshot,
  });

  const opsIssueCount =
    ops.duplicatePanels.length + ops.missingShortcuts.length + ops.overloadedPages.length;

  recordPlatformImprovementReview({
    priorityCount: priorities.length,
    monetizationGapCount: monetization.highPriorityMonetizationGaps.length,
    trustGapCount: trust.coverageGaps.length,
    opsIssueCount: Math.min(99, opsIssueCount),
    dataMoatGapCount: dataMoat.missingHighValueSignals.length,
  });

  return {
    clarity,
    monetization,
    trust,
    ops,
    dataMoat,
    priorities,
    createdAt: new Date().toISOString(),
  };
}
