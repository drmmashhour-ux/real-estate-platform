export type OfferScenario = {
  id: string;
  downPaymentPercent: number;
  interestRate: number;
  amortizationYears: number;
  /** Overrides global offer price for this row when set. */
  offerPrice?: number;
};

export const SCENARIO_PRESETS = {
  conservative: {
    label: "Conservative",
    downPaymentPercent: 20,
    interestRate: 5.5,
    amortizationYears: 25,
  },
  aggressive: {
    label: "Aggressive",
    downPaymentPercent: 10,
    interestRate: 5.5,
    amortizationYears: 25,
  },
  investor: {
    label: "Investor",
    downPaymentPercent: 25,
    interestRate: 6,
    amortizationYears: 30,
  },
} as const;

export const MAX_SCENARIOS = 4;
