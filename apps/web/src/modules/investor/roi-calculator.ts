/**
 * Illustrative ROI / yield math from user-supplied or platform-observed inputs.
 * NOT a securities offering or investment advice — always label outputs as estimates.
 */

export type RoiInputs = {
  purchasePriceCents: number;
  monthlyRentCents: number | null;
  annualTaxesCents: number | null;
  annualMaintenanceCents: number | null;
};

export type RoiEstimate = {
  grossYieldAnnualPct: number | null;
  netYieldAnnualPct: number | null;
  confidenceLabel: "low";
  disclaimer: string;
};

export function estimateRentalYield(input: RoiInputs): RoiEstimate {
  const disclaimer =
    "Illustrative yield only — excludes vacancy, financing, insurance, legal fees, and jurisdiction-specific rules. Not investment advice.";

  if (input.purchasePriceCents <= 0) {
    return { grossYieldAnnualPct: null, netYieldAnnualPct: null, confidenceLabel: "low", disclaimer };
  }

  const annualRent = input.monthlyRentCents != null ? input.monthlyRentCents * 12 : null;
  const grossYieldAnnualPct = annualRent != null ? (annualRent / input.purchasePriceCents) * 100 : null;

  const expenses =
    (input.annualTaxesCents ?? 0) + (input.annualMaintenanceCents ?? 0) + (annualRent != null ? annualRent * 0.05 : 0);
  const netYieldAnnualPct =
    annualRent != null ? ((annualRent - expenses) / input.purchasePriceCents) * 100 : null;

  return {
    grossYieldAnnualPct,
    netYieldAnnualPct,
    confidenceLabel: "low",
    disclaimer,
  };
}
