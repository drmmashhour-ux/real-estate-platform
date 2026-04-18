/**
 * FSBO / seller value props — exposure + AI assistance (human review for claims).
 */

import type { MontrealOpportunityRow } from "@/modules/market-intelligence/market-intelligence.types";

export type SellerPitchDraft = {
  headline: string;
  body: string;
  reviewRequired: true;
};

export function buildSellerPitchDraft(segment?: MontrealOpportunityRow | null): SellerPitchDraft {
  const area = segment?.neighborhood?.trim() || "Greater Montréal";
  return {
    headline: `Sell with clarity in ${area}`,
    body: [
      "Private-sale listings can pair structured disclosures with AI drafting assistance you approve before publish.",
      "Buyer interest and leads stay in your CRM with consent logs — no bulk cold outreach from this draft.",
      "Highlight photos, cadastre-backed verification when available, and transparent next steps for buyers.",
    ].join(" "),
    reviewRequired: true,
  };
}
