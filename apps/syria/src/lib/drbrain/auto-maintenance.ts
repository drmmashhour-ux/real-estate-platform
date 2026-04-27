import { sendDrBrainAlert } from "@repo/drbrain";
import type { DrBrainReport } from "@repo/drbrain";

const MIN_INTERVAL = 10 * 60 * 1000;
/** Per-action throttle — never runs hot loops or every minute (process-local memory only). */
const lastRun: Record<string, number> = {};

function shouldArmKillSwitch(report: DrBrainReport): boolean {
  if (report.status !== "CRITICAL") return false;
  return report.results.some((r) => {
    if (r.level !== "CRITICAL") return false;
    if (r.check.startsWith("payments.")) return true;
    if (r.check.startsWith("anomalies.")) return true;
    return false;
  });
}

export type SafeAutoMaintenanceOutcome =
  | { armed: false; reason: "not_eligible" | "rate_limited" }
  | { armed: true };

/**
 * Syria-only guarded automation: arms runtime kill switches only on CRITICAL payment/fraud signals,
 * at most once per cooldown window. Does not modify databases or release payouts.
 */
export async function runSafeAutoMaintenance(report: DrBrainReport): Promise<SafeAutoMaintenanceOutcome> {
  const key = "sybnb_kill_switch_auto";
  const now = Date.now();
  if (now - (lastRun[key] ?? 0) < MIN_INTERVAL) {
    return { armed: false, reason: "rate_limited" };
  }
  if (!shouldArmKillSwitch(report)) {
    return { armed: false, reason: "not_eligible" };
  }

  lastRun[key] = now;
  process.env.SYBNB_PAYMENTS_KILL_SWITCH = "true";
  process.env.SYBNB_PAYOUTS_KILL_SWITCH = "true";

  console.warn("[DR.BRAIN] AUTO PROTECTION ACTIVATED");

  await sendDrBrainAlert({
    appId: "syria",
    severity: "critical",
    title: "AUTO PROTECTION",
    message:
      "[DR.BRAIN ALERT]\nStatus: CRITICAL\nRecommendation: Check dashboard\nURL: /admin/dr-brain",
    metadata: {
      dashboardPath: "/admin/dr-brain",
      autoProtection: true,
    },
  });

  return { armed: true };
}
