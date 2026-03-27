/**
 * Québec GST/QST helpers — thin wrappers around `quebec-tax-engine.ts`.
 * Rates are configurable via engine constants; defaults GST 5%, QST 9.975%.
 * Not tax advice — verify with a CPA.
 */
import {
  QUEBEC_GST_RATE,
  QUEBEC_QST_RATE,
  calculateQuebecTaxExclusiveCents,
  calculateQuebecTaxInclusiveCents,
  roundCents,
  type TaxLineResult,
} from "@/lib/tax/quebec-tax-engine";

export { QUEBEC_GST_RATE, QUEBEC_QST_RATE };

export type GstQstBreakdown = TaxLineResult;

/** GST only on subtotal (5% default). */
export function calculateGst(amountCents: number): number {
  return roundCents(amountCents * QUEBEC_GST_RATE);
}

/** QST on subtotal+GST (9.975% default, compound). */
export function calculateQst(subtotalPlusGstCents: number): number {
  return roundCents(subtotalPlusGstCents * QUEBEC_QST_RATE);
}

/** Full exclusive breakdown: subtotal → GST → QST → total. */
export function calculateGstQstBreakdown(subtotalCents: number): GstQstBreakdown {
  return calculateQuebecTaxExclusiveCents({
    subtotalCents,
    gstRate: QUEBEC_GST_RATE,
    qstRate: QUEBEC_QST_RATE,
  });
}

/** When total includes tax, split back to subtotal + GST + QST. */
export function splitInclusiveTaxes(totalCents: number): GstQstBreakdown {
  return calculateQuebecTaxInclusiveCents({
    totalCents,
    gstRate: QUEBEC_GST_RATE,
    qstRate: QUEBEC_QST_RATE,
  });
}
