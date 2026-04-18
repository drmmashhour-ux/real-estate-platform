/**
 * Trust consolidation — pattern coverage (advisory).
 */

import type {
  PlatformTrustCoverageGap,
  PlatformTrustPatternId,
  PlatformTrustReviewResult,
} from "./platform-improvement.types";
import type { PlatformReviewSnapshot } from "./platform-review-snapshot";
import { getDefaultPlatformReviewSnapshot } from "./platform-review-snapshot";

export type PlatformTrustStripInput = {
  verifiedListing?: boolean;
  verifiedHostOrBroker?: boolean;
  updatedAt?: Date | string | null;
  secureCheckoutEnabled?: boolean;
  showNoHiddenFeesCopy?: boolean;
  realOpportunityNote?: string | null;
};

/**
 * Build trust strip lines from real booleans only — no invented badges.
 */
export function buildTrustStripLines(input: PlatformTrustStripInput): { key: string; label: string }[] {
  const lines: { key: string; label: string }[] = [];
  if (input.verifiedListing) lines.push({ key: "verified_listing", label: "Verified listing" });
  if (input.verifiedHostOrBroker) lines.push({ key: "verified_host_broker", label: "Verified host or broker" });
  if (input.updatedAt) {
    const d = typeof input.updatedAt === "string" ? new Date(input.updatedAt) : input.updatedAt;
    if (!Number.isNaN(d.getTime())) {
      lines.push({
        key: "updated_recently",
        label: `Updated ${d.toISOString().slice(0, 10)}`,
      });
    }
  }
  if (input.secureCheckoutEnabled) lines.push({ key: "secure_payment", label: "Secure checkout" });
  if (input.showNoHiddenFeesCopy) lines.push({ key: "no_hidden_fees", label: "No hidden fees (see terms)" });
  if (input.realOpportunityNote?.trim()) {
    lines.push({ key: "real_opportunities", label: input.realOpportunityNote.trim().slice(0, 120) });
  }
  return lines.slice(0, 5);
}

export function buildPlatformTrustReview(
  snapshot: PlatformReviewSnapshot = getDefaultPlatformReviewSnapshot(),
): PlatformTrustReviewResult {
  const supportedPatterns: PlatformTrustPatternId[] = [];
  if (snapshot.trustIndicatorsV1) {
    supportedPatterns.push("verified_listing", "verified_host_broker", "updated_recently");
  }
  if (snapshot.billingV1 || snapshot.subscriptionsV1) {
    supportedPatterns.push("secure_payment", "no_hidden_fees");
  }
  supportedPatterns.push("real_opportunities");

  const coverageGaps: PlatformTrustCoverageGap[] = [];
  if (!snapshot.trustIndicatorsV1) {
    coverageGaps.push({
      patternId: "verified_listing",
      gap: "Trust indicators off — listing cards may lack consistent verification affordances.",
    });
    coverageGaps.push({
      patternId: "verified_host_broker",
      gap: "Host/broker verification badges may not align across BNHub and broker panels.",
    });
  }
  if (!snapshot.listingMetricsV1) {
    coverageGaps.push({
      patternId: "updated_recently",
      gap: "Listing metrics off — “freshness” may rely on manual copy instead of signals.",
    });
  }
  if (!snapshot.billingV1) {
    coverageGaps.push({
      patternId: "secure_payment",
      gap: "Billing flag off — secure payment messaging must come from static copy only.",
    });
  }

  const standardizationNotes = [
    "Use `buildTrustStripLines` with real fields from listing/host/checkout — never fabricate verification.",
    "Keep BNHub, listings, and broker panels on the same vocabulary for “verified” and “secure”.",
  ];

  return { supportedPatterns: [...new Set(supportedPatterns)], coverageGaps, standardizationNotes };
}
