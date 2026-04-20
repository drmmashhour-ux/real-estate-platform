/**
 * Deterministic preview opportunities from metric signals — read-only.
 */

import { createHash } from "crypto";
import type { DomainTarget, ObservationSnapshot, Opportunity, ProposedAction, RiskLevel } from "../types/domain.types";
import {
  collectPreviewMetricCodes,
  type PreviewMetricSignalCode,
  previewStableSignalId,
} from "../signals/preview-signal-builder.service";
import type { MarketplaceSignal } from "../types/domain.types";

const DETECTOR_ID = "preview_metric_pipeline";

function stablePartId(parts: string[]): string {
  return createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 20);
}

function makeDeterministicAction(input: {
  listingId: string;
  opportunityCode: string;
  target: DomainTarget;
  builtAt: string;
  title: string;
  explanation: string;
  risk: RiskLevel;
}): ProposedAction {
  const opportunityId = `opp-preview-${stablePartId([input.listingId, input.opportunityCode])}`;
  return {
    id: `pa-preview-${stablePartId([input.listingId, input.opportunityCode, "task"])}`,
    type: "CREATE_TASK",
    target: input.target,
    confidence: 0.75,
    risk: input.risk,
    title: input.title,
    explanation: input.explanation,
    humanReadableSummary: input.explanation,
    metadata: {
      previewExecution: "DRY_RUN" as const,
      previewPipeline: true,
      previewOpportunityCode: input.opportunityCode,
    },
    suggestedAt: input.builtAt,
    sourceDetectorId: DETECTOR_ID,
    opportunityId,
  };
}

type OpportunityRule = {
  /** Metric signal that must be present to justify this opportunity. */
  requiredMetric: PreviewMetricSignalCode;
  /** Stable opportunity kind for audit surfaces. */
  opportunityCode:
    | "review_listing_visibility"
    | "improve_listing_conversion"
    | "review_pricing_position"
    | "verify_listing_readiness"
    | "review_booking_interest";
  title: string;
  explanation: string;
  risk: RiskLevel;
};

/** Priority order — first wins when selecting up to five opportunities. */
const OPPORTUNITY_RULES: OpportunityRule[] = [
  {
    requiredMetric: "inactive_listing",
    opportunityCode: "verify_listing_readiness",
    title: "Verify listing readiness",
    explanation:
      "Listing exposure signals suggest the listing is not fully live — confirm publishing checklist items before expecting traffic.",
    risk: "MEDIUM",
  },
  {
    requiredMetric: "missing_price",
    opportunityCode: "review_pricing_position",
    title: "Review pricing position",
    explanation: "Observed snapshot lacks a usable price — buyers cannot evaluate value until pricing is confirmed.",
    risk: "MEDIUM",
  },
  {
    requiredMetric: "low_views",
    opportunityCode: "review_listing_visibility",
    title: "Review listing visibility",
    explanation: "Views are below the preview visibility band — distribution, placement, or eligibility may warrant review.",
    risk: "LOW",
  },
  {
    requiredMetric: "weak_conversion_proxy",
    opportunityCode: "improve_listing_conversion",
    title: "Improve listing conversion signals",
    explanation:
      "Engagement exists but conversion proxy is weak — verify narrative quality, pricing clarity, and contact pathways.",
    risk: "LOW",
  },
  {
    requiredMetric: "low_booking_interest",
    opportunityCode: "review_booking_interest",
    title: "Review booking-style interest",
    explanation:
      "Booking-style signals are subdued — validate availability messaging and booking funnel surfaces if applicable.",
    risk: "LOW",
  },
];

/**
 * Maps preview metric signals to at most five explainable opportunities (no invented evidence).
 */
export function buildPreviewOpportunitiesFromSignals(
  signals: MarketplaceSignal[],
  observation: ObservationSnapshot,
): Opportunity[] {
  try {
    const listingId = observation.target.id ?? "";
    if (!listingId) {
      return [];
    }

    const codes = collectPreviewMetricCodes(listingId, signals);
    const builtAt = observation.builtAt ?? new Date().toISOString();
    const target: DomainTarget =
      observation.target.type === "fsbo_listing" ? { type: "fsbo_listing", id: listingId, label: observation.target.label } : observation.target;

    const out: Opportunity[] = [];

    for (const rule of OPPORTUNITY_RULES) {
      if (out.length >= 5) break;
      if (!codes.has(rule.requiredMetric)) continue;

      const pa = makeDeterministicAction({
        listingId,
        opportunityCode: rule.opportunityCode,
        target,
        builtAt,
        title: rule.title,
        explanation: rule.explanation,
        risk: rule.risk,
      });

      const opportunityId = pa.opportunityId;
      out.push({
        id: opportunityId,
        detectorId: DETECTOR_ID,
        title: rule.title,
        explanation: rule.explanation,
        confidence: 0.74,
        risk: rule.risk,
        evidence: {
          previewOpportunityCode: rule.opportunityCode,
          drivenByMetric: rule.requiredMetric,
          signalRef: previewStableSignalId(listingId, rule.requiredMetric),
        },
        proposedActions: [pa],
        createdAt: builtAt,
      });
    }

    return out;
  } catch {
    return [];
  }
}
