/**
 * Maps signals → opportunities — deterministic; bounded output; no execution.
 */

import type {
  DarlinkMarketplaceSnapshot,
  MarketplaceOpportunity,
  MarketplaceOpportunityType,
  MarketplaceSignal,
  MarketplaceSignalType,
} from "./darlink-marketplace-autonomy.types";

const MAX_OPPORTUNITIES = 80;

function oppId(seed: string): string {
  return `opp:${seed}`;
}

function pickTypesForSignal(t: MarketplaceSignalType): MarketplaceOpportunityType[] {
  switch (t) {
    case "low_conversion":
      return ["review_pricing", "improve_listing_content"];
    case "high_interest":
      return ["review_booking_friction", "promote_high_trust_listing"];
    case "fraud_risk":
      return ["request_admin_review", "reduce_risk"];
    case "stale_listing":
      return ["refresh_stale_listing"];
    case "payout_stress":
      return ["review_payout_state"];
    case "inactive_inventory":
      return ["increase_visibility", "refresh_stale_listing"];
    case "pricing_pressure":
      return ["review_pricing"];
    case "trust_risk":
    case "content_quality_issue":
      return ["improve_listing_content", "reduce_risk"];
    case "review_backlog":
      return ["request_admin_review"];
    case "booking_dropoff":
      return ["review_booking_friction"];
    case "engagement_spike":
      return ["prioritize_high_intent_leads", "increase_visibility"];
    default:
      return ["improve_listing_content"];
  }
}

function priorityFor(signal: MarketplaceSignal): number {
  const sev = signal.severity === "critical" ? 100 : signal.severity === "warning" ? 50 : 10;
  return sev + Math.min(20, signal.metrics ? Object.keys(signal.metrics).length : 0);
}

export function buildMarketplaceOpportunities(
  signals: MarketplaceSignal[],
  _snapshot: DarlinkMarketplaceSnapshot,
): MarketplaceOpportunity[] {
  try {
    const out: MarketplaceOpportunity[] = [];
    for (const s of signals) {
      const types = pickTypesForSignal(s.type);
      let i = 0;
      for (const typ of types) {
        const id = oppId(`${s.id}:${i}:${typ}`);
        out.push({
          id,
          type: typ,
          sourceSignalTypes: [s.type],
          entityType: s.entityType,
          entityId: s.entityId,
          title: `${typ.replace(/_/g, " ")} (${s.type})`,
          rationale: s.explanation,
          priority: priorityFor(s) + i,
        });
        i += 1;
      }
      if (out.length >= MAX_OPPORTUNITIES) break;
    }
    out.sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
    return out.slice(0, MAX_OPPORTUNITIES);
  } catch {
    return [];
  }
}
