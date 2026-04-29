import type { DrBrainReport } from "@repo/drbrain";
import { disableDemoModeSafely } from "@/lib/sybnb/demo-safety";
import { isDemoModeActive } from "@/lib/sybnb/runtime-flags";

/**
 * Production-risk CRITICAL checks only — never `build.*` (local/typecheck noise).
 *
 * Maps to operator intent (non-demo signals only — see {@link sybnbCoreAuditExcludeInvestorDemoWhere},
 * {@link syriaPropertyExcludeInvestorDemoWhere}, booking exclusions in `demo-metrics-filter`):
 * - DB health → `database.*`
 * - Payment rail / escrow posture → `payments.*`
 * - Fraud / blocked-payment spikes (`syriaMarketplaceAnomalies` uses demo-filtered {@link getSybnbPaymentStats}) → `anomalies.*`
 * - Env isolation → `env.*`
 * - Security posture → `security.*`
 *
 * Excluded from shutdown triggers: synthetic investor-demo DR.BRAIN (`DRBRAIN_INVESTOR_DEMO_MODE`), demo audit rows,
 * demo bookings/listings (metrics + anomaly hooks).
 */
const DEMO_FAILSAFE_CRITICAL_PREFIXES = ["database.", "payments.", "anomalies.", "security.", "env."] as const;

function reportHasProductionRiskCritical(report: DrBrainReport): boolean {
  const criticals = report.results.filter((r) => r.level === "CRITICAL" && !r.ok);
  if (criticals.length === 0) return false;
  if (criticals.every((r) => r.check.startsWith("build."))) {
    return false;
  }
  return criticals.some((r) =>
    DEMO_FAILSAFE_CRITICAL_PREFIXES.some((prefix) => r.check.startsWith(prefix)),
  );
}

/**
 * True when this report should arm the investor-demo failsafe (CRITICAL + at least one production-risk check).
 * Not every `report.status === "CRITICAL"` (e.g. build-only) qualifies — avoids instability / false shutdowns.
 */
export function syriaDrBrainReportRequiresDemoFailsafe(report: DrBrainReport): boolean {
  return report.status === "CRITICAL" && reportHasProductionRiskCritical(report);
}

/**
 * After Dr. Brain computes a real (non-synthetic) report: disable investor demo when the failsafe predicate holds.
 *
 * Read-only DR.BRAIN rollups must not call this (`runSyriaDrBrainReportReadOnly`).
 */
export async function afterSyriaDrBrainReportComputed(report: DrBrainReport): Promise<void> {
  if (!syriaDrBrainReportRequiresDemoFailsafe(report)) return;
  if (!(await isDemoModeActive())) return;

  await disableDemoModeSafely("Dr. Brain detected CRITICAL system issue");
}
