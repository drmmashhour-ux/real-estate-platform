import type { DrBrainReport } from "@repo/drbrain";
import { disableDemoModeSafely } from "@/lib/sybnb/demo-safety";
import { isDemoModeActive } from "@/lib/sybnb/runtime-flags";

/**
 * Auto-disable demo only when CRITICAL results indicate production/system risk — not build-only failures.
 *
 * Covers (via check id prefixes): DB health (`database.*`), payment rail posture (`payments.*`),
 * fraud/anomaly hooks fed by non-demo metrics (`anomalies.*`), env isolation (`env.*`).
 * Security hooks may gain CRITICAL checks later (`security.*`).
 *
 * Excludes: `build.*` (local/typecheck noise). Fraud/payment/error aggregates exclude `metadata.demo === true`
 * and demo listings/bookings (`demo-metrics-filter`, raw SQL in {@link getDrBrainMetrics}).
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
 * After Dr. Brain computes a real (non-synthetic) report: disable investor demo only when the report is
 * CRITICAL **and** at least one failing CRITICAL check is a production-risk category (not build-only).
 *
 * Read-only DR.BRAIN rollups must not call this.
 */
export async function afterSyriaDrBrainReportComputed(report: DrBrainReport): Promise<void> {
  if (report.status !== "CRITICAL") return;
  if (!reportHasProductionRiskCritical(report)) return;
  if (!(await isDemoModeActive())) return;

  await disableDemoModeSafely("Dr. Brain detected CRITICAL system issue");
}
