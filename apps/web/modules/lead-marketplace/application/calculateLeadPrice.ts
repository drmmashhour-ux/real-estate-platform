/**
 * Dynamic lead pricing from deal/trust/engagement + city demand.
 * Prices are in minor units (cents CAD).
 */
export type LeadPricingInput = {
  dealScore: number | null;
  trustScore: number | null;
  engagementScore: number;
  highIntent: boolean;
  /** 0–1 proxy: inventory / activity in market data for the city */
  cityDemand01: number;
};

const MIN_CENTS = 2_900;
const MAX_CENTS = 29_900;

export function calculateLeadPriceCents(input: LeadPricingInput): number {
  const d = (input.dealScore ?? 50) / 100;
  const t = (input.trustScore ?? 50) / 100;
  const e = Math.min(1, Math.max(0, input.engagementScore) / 100);
  const intentBoost = input.highIntent ? 0.12 : 0;
  const quality = 0.42 * d + 0.38 * t + 0.2 * e + intentBoost;
  const demand = 0.88 + 0.42 * Math.min(1, Math.max(0, input.cityDemand01));
  const span = MAX_CENTS - MIN_CENTS;
  const raw = MIN_CENTS + span * Math.min(1.15, Math.max(0, quality)) * demand;
  return Math.round(Math.min(MAX_CENTS * 1.2, Math.max(MIN_CENTS, raw)));
}

/** Composite 0–100 score for marketplace sorting (not the same as billing cents). */
export function calculateMarketplaceListingScore(input: LeadPricingInput): number {
  const d = input.dealScore ?? 50;
  const t = input.trustScore ?? 50;
  const e = Math.min(100, Math.max(0, input.engagementScore));
  const intent = input.highIntent ? 12 : 0;
  const u = input.cityDemand01 * 20;
  return Math.round(Math.min(100, Math.max(0, 0.34 * d + 0.34 * t + 0.22 * (e / 100) * 100 + intent + u)));
}
