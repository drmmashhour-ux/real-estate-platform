/**
 * Region-aware trust/risk annotations for Syria — indicators only; no Québec legal pack scores.
 */
import type { SyriaRegionSummary } from "./syria-region.types";

export type SyriaTrustRiskOverlay = {
  fraudElevatedHint: boolean;
  reviewBacklogHint: boolean;
  payoutPipelineStressHint: boolean;
  normalizedRiskTags: readonly string[];
  trustAvailabilityNotes: readonly string[];
  legalPackAvailability: "qc_not_applicable";
  quebecComplianceEngine: "unavailable_for_syria_region";
};

function sortedUnique(tags: string[]): string[] {
  return [...new Set(tags)].sort((a, b) => a.localeCompare(b));
}

/** Deterministic overlay from aggregate Syria summary — never throws. */
export function buildSyriaTrustRiskOverlay(summary: SyriaRegionSummary | null): SyriaTrustRiskOverlay {
  if (!summary) {
    return {
      fraudElevatedHint: false,
      reviewBacklogHint: false,
      payoutPipelineStressHint: false,
      normalizedRiskTags: sortedUnique(["syria_data_unavailable"]),
      trustAvailabilityNotes: [
        "Syria trust overlay skipped — no aggregate snapshot (adapter disabled or read failed).",
      ],
      legalPackAvailability: "qc_not_applicable",
      quebecComplianceEngine: "unavailable_for_syria_region",
    };
  }

  const tags: string[] = [];
  if (summary.fraudFlaggedListings > 0) {
    tags.push("syria_fraud_flag_present");
  }
  if (summary.pendingReviewListings >= 5) {
    tags.push("syria_review_backlog_elevated");
  }
  if (summary.payoutsPending > summary.payoutsPaid && summary.payoutsPending >= 3) {
    tags.push("syria_payout_pending_stress");
  }

  const fraudElevatedHint = summary.fraudFlaggedListings > 0;
  const reviewBacklogHint = summary.pendingReviewListings >= 5;
  const payoutPipelineStressHint = summary.payoutsPending > summary.payoutsPaid && summary.payoutsPending >= 3;

  return {
    fraudElevatedHint,
    reviewBacklogHint,
    payoutPipelineStressHint,
    normalizedRiskTags: sortedUnique(tags.length ? tags : ["syria_no_critical_flags"]),
    trustAvailabilityNotes: [
      "Syria uses region-local moderation and manual payout rails — Québec OACIQ / broker compliance engines are not applied.",
      "Fraud signals are Syria `fraud_flag` and booking-level fraud markers only — not cross-mapped to legacy web trust scores.",
    ],
    legalPackAvailability: "qc_not_applicable",
    quebecComplianceEngine: "unavailable_for_syria_region",
  };
}
