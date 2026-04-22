/**
 * LECIPM launch metered plans (broker SD workspace) — env-tunable for production.
 */
export const LECIPM_LAUNCH_PLANS = ["FREE", "PRO", "AGENCY", "ENTERPRISE"] as const;
export type LecipmLaunchPlan = (typeof LECIPM_LAUNCH_PLANS)[number];

export function freeMonthlyTransactionCap(): number {
  const raw = process.env.LECIPM_LAUNCH_FREE_TX_PER_MONTH;
  const n = raw ? Number.parseInt(raw, 10) : 5;
  return Number.isFinite(n) && n >= 0 ? n : 5;
}

export function revenueCentsDefaults(): Record<string, number> {
  return {
    LEAD: Number(process.env.LECIPM_REVENUE_LEAD_CENTS ?? "2500") || 2500,
    TRANSACTION: Number(process.env.LECIPM_REVENUE_TRANSACTION_CENTS ?? "2900") || 2900,
    CONTRACT: Number(process.env.LECIPM_REVENUE_CONTRACT_CENTS ?? "1500") || 1500,
    SIGNATURE: Number(process.env.LECIPM_REVENUE_SIGNATURE_CENTS ?? "900") || 900,
    CREDIT_CHECK: Number(process.env.LECIPM_REVENUE_CREDIT_CHECK_CENTS ?? "4900") || 4900,
  };
}
