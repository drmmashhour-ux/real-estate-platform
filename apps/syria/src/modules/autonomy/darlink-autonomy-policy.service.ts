/**
 * Deterministic policy layer — no side effects; never throws.
 */

import type {
  DarlinkMarketplaceSnapshot,
  MarketplaceOpportunity,
  MarketplacePolicyEvaluation,
  MarketplaceProposalPolicyOutcome,
  MarketplaceSignal,
} from "./darlink-marketplace-autonomy.types";
import { getDarlinkAutonomyFlags } from "@/lib/platform-flags";

export type EvaluateMarketplacePolicyParams = {
  snapshot: DarlinkMarketplaceSnapshot;
  signals: MarketplaceSignal[];
  opportunities: MarketplaceOpportunity[];
};

function fraudListingIds(snapshot: DarlinkMarketplaceSnapshot, signals: MarketplaceSignal[]): Set<string> {
  const s = new Set<string>();
  for (const l of snapshot.listings) {
    if (l.fraudFlag) s.add(l.id);
  }
  for (const x of signals) {
    if (x.type === "fraud_risk" && x.entityType === "listing" && x.entityId) {
      s.add(x.entityId);
    }
  }
  return s;
}

function fraudBookingIds(signals: MarketplaceSignal[]): Set<string> {
  const s = new Set<string>();
  for (const x of signals) {
    if (x.type === "fraud_risk" && x.entityType === "booking" && x.entityId) {
      s.add(x.entityId);
    }
  }
  return s;
}

function oppTouchesFraudListing(
  o: MarketplaceOpportunity,
  fraudListings: Set<string>,
): boolean {
  return o.entityType === "listing" && o.entityId !== null && fraudListings.has(o.entityId);
}

function classifyOpportunity(
  o: MarketplaceOpportunity,
  params: {
    fraudListings: Set<string>;
    fraudBookings: Set<string>;
    snapshot: DarlinkMarketplaceSnapshot;
    bookingInconsistent: boolean;
    payoutStress: boolean;
    pendingReviewHeavy: boolean;
  },
): { outcome: MarketplaceProposalPolicyOutcome; reasons: string[] } {
  const reasons: string[] = [];

  if (params.pendingReviewHeavy && o.type === "promote_high_trust_listing") {
    reasons.push("moderation_backlog_prioritized_over_promotion");
    return { outcome: "blocked", reasons };
  }

  if (oppTouchesFraudListing(o, params.fraudListings)) {
    if (
      o.type === "increase_visibility" ||
      o.type === "promote_high_trust_listing" ||
      o.type === "review_pricing"
    ) {
      reasons.push("fraud_or_trust_escalation_lane");
      return { outcome: "blocked", reasons };
    }
    if (o.type === "request_admin_review" || o.type === "reduce_risk") {
      reasons.push("human_review_required_for_flagged_inventory");
      return { outcome: "approval_required", reasons };
    }
  }

  if (o.entityType === "booking" && o.entityId && params.fraudBookings.has(o.entityId)) {
    reasons.push("booking_fraud_lane");
    return { outcome: "approval_required", reasons };
  }

  if (params.bookingInconsistent && (o.type === "review_booking_friction" || o.type === "review_payout_state")) {
    reasons.push("state_inconsistency_review");
    return { outcome: "approval_required", reasons };
  }

  if (params.payoutStress && o.type === "review_payout_state") {
    reasons.push("payout_backlog_policy");
    return { outcome: "approval_required", reasons };
  }

  const lowQuality =
    o.type === "improve_listing_content" ||
    o.type === "refresh_stale_listing" ||
    o.type === "review_pricing";
  if (lowQuality && o.entityId && params.fraudListings.has(o.entityId)) {
    reasons.push("flagged_listing_internal_only");
    return { outcome: "approval_required", reasons };
  }

  return { outcome: "allowed", reasons: ["policy_pass"] };
}

export function evaluateMarketplacePolicy(params: EvaluateMarketplacePolicyParams): MarketplacePolicyEvaluation {
  try {
    const notes: string[] = [];
    const fraudListings = fraudListingIds(params.snapshot, params.signals);
    const fraudBookings = fraudBookingIds(params.signals);

    const bookingInconsistent = params.signals.some(
      (s) => s.type === "booking_dropoff" && s.reasonCode === "confirmed_unpaid_inconsistent",
    );
    const payoutStress = params.signals.some((s) => s.type === "payout_stress");
    const pendingReviewHeavy = params.snapshot.aggregates.pendingReviewListings >= 5;

    let sensitiveFinancialBlocked = fraudListings.size > 0 || fraudBookings.size > 0 || bookingInconsistent;
    let listingMutationBlocked = fraudListings.size > 0;

    if (!getDarlinkAutonomyFlags().AUTONOMY_ENABLED) {
      notes.push("policy_autonomy_master_disabled");
      sensitiveFinancialBlocked = true;
      listingMutationBlocked = true;
    }

    const opportunityOutcomes: MarketplacePolicyEvaluation["opportunityOutcomes"] = {};

    for (const o of params.opportunities) {
      const r = classifyOpportunity(o, {
        fraudListings,
        fraudBookings,
        snapshot: params.snapshot,
        bookingInconsistent,
        payoutStress,
        pendingReviewHeavy,
      });
      opportunityOutcomes[o.id] = { outcome: r.outcome, reasons: r.reasons };
    }

    return {
      sensitiveFinancialBlocked,
      listingMutationBlocked,
      opportunityOutcomes,
      notes,
    };
  } catch {
    return {
      sensitiveFinancialBlocked: true,
      listingMutationBlocked: true,
      opportunityOutcomes: {},
      notes: ["policy_eval_failed_safe_block"],
    };
  }
}
