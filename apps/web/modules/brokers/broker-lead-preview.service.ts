/**
 * Anonymized lead preview — no real PII; illustrative structure only.
 */

export type BrokerLeadPreviewItem = {
  id: string;
  locationMask: string;
  intentLabel: string;
  budgetBand: string | null;
  messageExcerpt: string;
  qualityBand: "high" | "medium" | "warm";
};

export type BrokerLeadPreviewPayload = {
  items: BrokerLeadPreviewItem[];
  disclaimer: string;
};

/**
 * Deterministic masked samples — clearly not live leads unless you wire real aggregates later.
 */
export function buildBrokerLeadPreview(): BrokerLeadPreviewPayload {
  return {
    disclaimer:
      "Illustrative examples only — not your live inbox. Real leads are masked until unlock; quality depends on intake and routing.",
    items: [
      {
        id: "sample-1",
        locationMask: "Montréal — central / Plateau area",
        intentLabel: "Buyer — financing pre-approved",
        budgetBand: "$600k – $800k",
        messageExcerpt: "Looking for a 3-bed with parking; flexible on closing…",
        qualityBand: "high",
      },
      {
        id: "sample-2",
        locationMask: "Laval — family corridor",
        intentLabel: "Seller — compare broker vs FSBO",
        budgetBand: "Est. list mid–high five figures",
        messageExcerpt: "Want a valuation range before deciding how to list…",
        qualityBand: "medium",
      },
      {
        id: "sample-3",
        locationMask: "Waterfront / short-stay corridor",
        intentLabel: "Host — short-term rental interest",
        budgetBand: "Nightly + occupancy dependent",
        messageExcerpt: "Exploring BNHub-style calendar and payout flow…",
        qualityBand: "warm",
      },
    ],
  };
}
