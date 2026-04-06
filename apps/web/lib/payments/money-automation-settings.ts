export interface MoneyAutomationSettings {
  payoutsEnabled: boolean;
  payoutRunLimit: number;
  autoPayoutsBlocked: boolean;
}

function envBool(key: string, defaultValue: boolean): boolean {
  const v = process.env[key]?.trim().toLowerCase();
  if (v === "1" || v === "true" || v === "yes") return true;
  if (v === "0" || v === "false" || v === "no") return false;
  return defaultValue;
}

function envInt(key: string, fallback: number): number {
  const n = Number(process.env[key]?.trim());
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

/**
 * Global money automation guardrails (cron / internal routes).
 * - `BNHUB_PAYOUTS_DISABLED=1` — hard stop (payout runner no-ops).
 * - `BNHUB_PAYOUT_RUN_LIMIT` — max Stripe transfers per run (default 25).
 * - `BNHUB_AUTO_PAYOUTS_BLOCKED=1` — eligibility computed but runner skips execution.
 */
export function getMoneyAutomationSettings(): MoneyAutomationSettings {
  return {
    payoutsEnabled: !envBool("BNHUB_PAYOUTS_DISABLED", false),
    payoutRunLimit: envInt("BNHUB_PAYOUT_RUN_LIMIT", 25),
    autoPayoutsBlocked: envBool("BNHUB_AUTO_PAYOUTS_BLOCKED", false),
  };
}
