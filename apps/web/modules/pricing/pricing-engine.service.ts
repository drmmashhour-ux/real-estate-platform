/**
 * LECIPM Monetization System v1 — core pricing math (server-only).
 * Amounts are illustrative unless tied to live Stripe checkout — see notes on each result.
 */

export type FeeLine = { label: string; amount: number; currency: string };

export type EnginePricingResult = {
  gross: number;
  fees: FeeLine[];
  net: number;
  breakdown: FeeLine[];
  notes: string[];
};

/**
 * BNHub-style lodging quote: `nightlyPrice` × `nights` = lodging subtotal (major currency units).
 * Host and guest fees apply to that subtotal (same basis as checkout education helpers).
 */
export function calculateBNHubPricing(input: {
  nightlyPrice: number;
  nights: number;
  hostFeePercent: number;
  guestFeePercent: number;
  currency?: string;
}): EnginePricingResult {
  const currency = input.currency ?? "CAD";
  const nights = Math.max(0, input.nights);
  const nightly = Math.max(0, input.nightlyPrice);
  const lodgingSubtotal = nightly * nights;
  const hf = Math.min(100, Math.max(0, input.hostFeePercent));
  const gf = Math.min(100, Math.max(0, input.guestFeePercent));

  const hostFeeAmount = lodgingSubtotal * (hf / 100);
  const guestFeeAmount = lodgingSubtotal * (gf / 100);

  const fees: FeeLine[] = [
    { label: "Host platform fee (lodging subtotal)", amount: hostFeeAmount, currency },
    { label: "Guest service fee (lodging subtotal)", amount: guestFeeAmount, currency },
  ];

  const guestTotal = lodgingSubtotal + guestFeeAmount;
  const hostNetLodging = lodgingSubtotal - hostFeeAmount;

  const breakdown: FeeLine[] = [
    { label: "Lodging subtotal (nightly × nights)", amount: lodgingSubtotal, currency },
    { label: "Guest pays (lodging + guest fee)", amount: guestTotal, currency },
    { label: "Host net from lodging (after host fee)", amount: hostNetLodging, currency },
  ];

  return {
    gross: lodgingSubtotal,
    fees,
    net: hostNetLodging,
    breakdown,
    notes: [
      "Lodging subtotal excludes cleaning/taxes unless you add them in a separate calculator call.",
      "Percent inputs are 0–100 (e.g. 12 for 12%).",
      "Figures are deterministic quotes — actual checkout may include taxes, discounts, and Stripe line items.",
    ],
  };
}

/**
 * Broker economics on a single illustrative deal: `dealValue` = gross commission (major currency units).
 */
export function calculateBrokerPricing(input: {
  dealValue: number;
  leadFee: number;
  successFeePercent: number;
  currency?: string;
}): EnginePricingResult {
  const currency = input.currency ?? "CAD";
  const gross = Math.max(0, input.dealValue);
  const lead = Math.max(0, input.leadFee);
  const sf = Math.min(100, Math.max(0, input.successFeePercent));
  const successFee = gross * (sf / 100);
  const net = gross - successFee - lead;

  const fees: FeeLine[] = [
    { label: "Platform / success fee (on commission)", amount: successFee, currency },
    { label: "Lead fee (allocated to this deal)", amount: lead, currency },
  ];

  return {
    gross,
    fees,
    net,
    breakdown: [
      { label: "Gross commission (input)", amount: gross, currency },
      { label: "Net after fees (illustrative)", amount: net, currency },
    ],
    notes: [
      "Not tax or split-partner advice — model one broker’s share only unless you adjust inputs.",
      "Lead fee allocation is simplified (single deal attribution).",
    ],
  };
}

/** BNHub nightly suggestion rows (30-day horizon); apply path updates `nightPriceCents` via `pricing-apply.service`. */
export {
  generatePricing,
  generatePricingForEnabledListings,
  type BnhubPricingSuggestionRow,
} from "./bnhub-dynamic-pricing-suggestions.service";

export { applyPricingSuggestion } from "./pricing-apply.service";
