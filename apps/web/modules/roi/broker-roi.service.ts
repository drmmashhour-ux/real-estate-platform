import { PRICING } from "@/lib/monetization/pricing";

export type BrokerRoiEstimateInput = {
  /** Raw leads per month (CRM or marketing). */
  leadsPerMonth: number;
  /** Share of leads that are qualified (0–1). */
  qualificationRate: number;
  /** Close rate on qualified leads (0–1). */
  closeRate: number;
  /** Average gross commission per closed deal (CAD dollars). */
  avgGrossCommissionPerDeal: number;
  /** Platform take on gross commission (0–1) — policy input, not legal advice. */
  platformSuccessFeePercent: number;
  /** Optional fixed monthly subscription (CAD dollars). */
  monthlySubscriptionDollars?: number;
  /** Override lead price (CAD); default `PRICING.leadPriceCents`. */
  leadPriceDollars?: number;
};

export type BrokerRoiEstimateResult = {
  isEstimate: true;
  monthlyQualifiedLeads: number;
  monthlyClosedDeals: number;
  grossCommissionDollars: number;
  platformFeesDollars: number;
  leadSpendDollars: number;
  subscriptionDollars: number;
  netDollars: number;
  breakEvenLeadsApprox: number | null;
  disclaimers: string[];
};

/**
 * Illustrative brokerage P&L — **not** a promise of income; inputs are yours to validate.
 */
export function estimateBrokerRoi(input: BrokerRoiEstimateInput): BrokerRoiEstimateResult | { error: string } {
  if (input.leadsPerMonth < 0 || input.qualificationRate < 0 || input.qualificationRate > 1) {
    return { error: "Invalid qualification inputs" };
  }
  if (input.closeRate < 0 || input.closeRate > 1) return { error: "Invalid close rate" };
  const pf = Math.max(0, Math.min(0.5, input.platformSuccessFeePercent));

  const leadUnit =
    input.leadPriceDollars != null ? Math.max(0, input.leadPriceDollars) : PRICING.leadPriceCents / 100;

  const qualified = input.leadsPerMonth * input.qualificationRate;
  const closed = qualified * input.closeRate;
  const gross = closed * Math.max(0, input.avgGrossCommissionPerDeal);
  const platformFees = gross * pf;
  const leadSpend = input.leadsPerMonth * leadUnit;
  const sub = input.monthlySubscriptionDollars ?? 0;
  const net = gross - platformFees - leadSpend - sub;

  return {
    isEstimate: true,
    monthlyQualifiedLeads: qualified,
    monthlyClosedDeals: closed,
    grossCommissionDollars: gross,
    platformFeesDollars: platformFees,
    leadSpendDollars: leadSpend,
    subscriptionDollars: sub,
    netDollars: net,
    breakEvenLeadsApprox: null as number | null,
    disclaimers: [
      "Estimates only — real closings depend on market, pricing, and compliance.",
      "Lead price defaults to internal `PRICING.leadPriceCents` unless overridden.",
      "Break-even not auto-solved in v1 — use finance model for board numbers.",
    ],
  };
}

/** Alias shape for product APIs — all figures remain estimates. */
export function summarizeBrokerRoiForApi(input: BrokerRoiEstimateInput) {
  const r = estimateBrokerRoi(input);
  if ("error" in r) return r;
  return {
    leads: input.leadsPerMonth,
    conversionRate: input.qualificationRate * input.closeRate,
    commission: r.grossCommissionDollars,
    netProfit: r.netDollars,
    breakEven: r.breakEvenLeadsApprox,
    disclaimer: "Estimate only" as const,
    detail: r,
  };
}
