/**
 * Québec closing fund checkpoints — constants only (safe for client bundles; no DB / Prisma).
 */
export const FUND_MILESTONE_KINDS = ["DEPOSIT", "MORTGAGE_FUNDS", "FINAL_DISBURSEMENT"] as const;
export type ClosingFundMilestoneKind = (typeof FUND_MILESTONE_KINDS)[number];

export const FUND_MILESTONE_LABELS: Record<ClosingFundMilestoneKind, string> = {
  DEPOSIT: "Deposit / immobilisation",
  MORTGAGE_FUNDS: "Mortgage / lender funds",
  FINAL_DISBURSEMENT: "Final disbursement & trust release",
};
