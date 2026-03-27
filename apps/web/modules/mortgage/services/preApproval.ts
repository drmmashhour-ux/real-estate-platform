/** Heuristic pre-approval estimate — not a commitment; broker confirms eligibility. */

export type ApprovalConfidence = "low" | "medium" | "high";

export type PreApprovalEstimate = {
  /** Rough max loan capacity from debt-ratio rule + heuristic. */
  estimatedLoan: number;
  maxMonthlyPayment: number;
  /** Loan + down payment (proxy for purchase power). */
  estimatedApprovalAmount: number;
  /** Max housing payment per month from GDS-style ratio (39% of gross monthly income). */
  estimatedMonthlyPayment: number;
  approvalConfidence: ApprovalConfidence;
};

const MAX_DEBT_RATIO = 0.39;
const AMORTIZATION_YEARS = 25;
/** User-specified heuristic multiplier on loan capacity. */
const LOAN_HEURISTIC_FACTOR = 0.8;

/**
 * monthlyIncome = income / 12
 * maxMonthlyPayment = monthlyIncome * 0.39
 * estimatedLoan = maxMonthlyPayment * 12 * years * 0.8
 * estimatedApprovalAmount = estimatedLoan + downPayment
 */
export function computePreApprovalEstimate(params: {
  income: number;
  propertyPrice: number;
  downPayment: number;
}): PreApprovalEstimate {
  const { income, propertyPrice, downPayment } = params;
  const monthlyIncome = income / 12;
  const maxMonthlyPayment = monthlyIncome * MAX_DEBT_RATIO;
  const estimatedLoan = maxMonthlyPayment * 12 * AMORTIZATION_YEARS * LOAN_HEURISTIC_FACTOR;
  const estimatedApprovalAmount = estimatedLoan + downPayment;

  const downRatio = propertyPrice > 0 ? downPayment / propertyPrice : 0;

  let approvalConfidence: ApprovalConfidence;
  if (downRatio >= 0.2 && income > 0) {
    approvalConfidence = "high";
  } else if (downRatio >= 0.1) {
    approvalConfidence = "medium";
  } else {
    approvalConfidence = "low";
  }

  return {
    estimatedLoan,
    maxMonthlyPayment,
    estimatedApprovalAmount,
    estimatedMonthlyPayment: maxMonthlyPayment,
    approvalConfidence,
  };
}

export function confidenceLabel(c: ApprovalConfidence): string {
  switch (c) {
    case "high":
      return "High";
    case "medium":
      return "Medium";
    default:
      return "Low";
  }
}
