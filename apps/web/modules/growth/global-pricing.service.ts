/**
 * Region-aware pricing hints (CAD base) — advisory; does not alter Stripe or live checkout amounts.
 */

import { PRICING_CONFIG } from "@/modules/revenue/pricing-config";

export type GlobalMarketRegion = "CA" | "US" | "EU_UK" | "OTHER";

export type GlobalPricingHint = {
  region: GlobalMarketRegion;
  currencyLabel: string;
  /** Multiplier applied to Canada anchor (display only). */
  priceMultiplier: number;
  suggestedLeadPriceCadEquivalent: number;
  note: string;
};

const REGION_META: Record<
  GlobalMarketRegion,
  { currencyLabel: string; multiplier: number; note: string }
> = {
  CA: {
    currencyLabel: "CAD",
    multiplier: 1,
    note: "Primary LECIPM region — anchor from PRICING_CONFIG.",
  },
  US: {
    currencyLabel: "USD (display parity)",
    multiplier: 1.08,
    note: "FX + compliance overhead — confirm localized checkout before go-live.",
  },
  EU_UK: {
    currencyLabel: "EUR/GBP (parity)",
    multiplier: 1.12,
    note: "Regulatory + VAT considerations — manual pricing review required.",
  },
  OTHER: {
    currencyLabel: "Local",
    multiplier: 1,
    note: "Fallback — set market-specific anchors per launch playbook.",
  },
};

export function getGlobalPricingHints(region: GlobalMarketRegion = "CA"): GlobalPricingHint {
  const anchor = PRICING_CONFIG.canada.lead.default;
  const m = REGION_META[region];
  const suggestedLeadPriceCadEquivalent = Math.round(anchor * m.multiplier * 100) / 100;
  return {
    region,
    currencyLabel: m.currencyLabel,
    priceMultiplier: m.multiplier,
    suggestedLeadPriceCadEquivalent,
    note: m.note,
  };
}

export function listGlobalPricingMatrix(): GlobalPricingHint[] {
  return (Object.keys(REGION_META) as GlobalMarketRegion[]).map((region) => getGlobalPricingHints(region));
}
