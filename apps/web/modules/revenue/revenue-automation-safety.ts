/**
 * Automation safety — kill switch and caps (env-only; reversible).
 */

function envTrue(k: string): boolean {
  return process.env[k] === "true" || process.env[k] === "1";
}

export function isRevenueAutomationKillSwitchActive(): boolean {
  return envTrue("FEATURE_AUTOMATION_KILL_SWITCH");
}

export function getMaxAutomationActionsPerRun(): number {
  const raw = process.env.REVENUE_AUTOMATION_MAX_ACTIONS_PER_RUN?.trim();
  const n = raw ? Number(raw) : 12;
  return Number.isFinite(n) && n >= 1 && n <= 50 ? Math.floor(n) : 12;
}
