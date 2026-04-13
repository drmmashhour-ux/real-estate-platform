/**
 * Pure rental ROI helpers for `/tools/roi-calculator` — testable, no React.
 */

/** Monthly payment (standard amortization; Canadian compounding nuances are approximate). */
export function monthlyMortgagePayment(principal: number, annualRatePct: number, years: number): number {
  const p = Number(principal);
  const y = Number(years);
  if (!Number.isFinite(p) || !Number.isFinite(y) || p <= 0 || y <= 0) return 0;
  const r = Number(annualRatePct) / 100 / 12;
  const n = y * 12;
  if (!Number.isFinite(r) || !Number.isFinite(n) || n <= 0) return 0;
  if (r <= 0) return p / n;
  return (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export type RoiCalculatorMetrics = {
  grossYield: number | null;
  capRate: number | null;
  cashOnCash: number | null;
  annualMortgage: number;
  annualNoi: number;
  cashDown: number;
};

/**
 * @param price — purchase price (CAD), must be > 0 for yield metrics
 * @param downPct — 0–100
 */
export function computeRoiCalculatorMetrics(input: {
  price: number;
  monthlyRent: number;
  monthlyExpenses: number;
  downPct: number;
  ratePct: number;
  amortYears: number;
}): RoiCalculatorMetrics {
  const p = Number(input.price);
  const rent = Math.max(0, Number(input.monthlyRent));
  const exp = Math.max(0, Number(input.monthlyExpenses));
  const down = Math.min(100, Math.max(0, Number(input.downPct)));
  const r = Number(input.ratePct);
  const yrs = Math.max(1, Math.min(40, Math.floor(Number(input.amortYears)) || 25));

  if (!Number.isFinite(p) || p <= 0) {
    return {
      grossYield: null,
      capRate: null,
      cashOnCash: null,
      annualMortgage: 0,
      annualNoi: 0,
      cashDown: 0,
    };
  }

  const cashDown = (p * down) / 100;
  const loan = Math.max(0, p - cashDown);
  const pmt = monthlyMortgagePayment(loan, Number.isFinite(r) ? r : 0, yrs);
  const annualRent = rent * 12;
  const annualExp = exp * 12;
  const annualMortgage = pmt * 12;
  const noi = annualRent - annualExp;
  const grossYield = (annualRent / p) * 100;
  const capRate = (noi / p) * 100;
  const annualCashFlow = noi - annualMortgage;
  const cashOnCash = cashDown > 0 ? (annualCashFlow / cashDown) * 100 : null;

  return {
    grossYield: Number.isFinite(grossYield) ? grossYield : null,
    capRate: Number.isFinite(capRate) ? capRate : null,
    cashOnCash: cashOnCash != null && Number.isFinite(cashOnCash) ? cashOnCash : null,
    annualMortgage,
    annualNoi: noi,
    cashDown,
  };
}
