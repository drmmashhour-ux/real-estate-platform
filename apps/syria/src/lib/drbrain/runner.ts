import type { DrBrainReport } from "@repo/drbrain";
import { isInvestorDemoModeActive } from "@/lib/sybnb/investor-demo";
import { disableDemoModeSafely } from "@/lib/sybnb/demo-safety";

/**
 * CRITICAL checks that justify auto-disabling investor demo (production-risk signals).
 * Excludes e.g. local build/typecheck failures (`build.*`) — those must not kill demo sessions.
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
 * PHASE 3 — After Dr. Brain computes a real (non-synthetic) report: disable investor demo if CRITICAL
 * production-risk signals fire while demo is active. Read-only paths never call this.
 */
export async function afterSyriaDrBrainReportComputed(report: DrBrainReport): Promise<void> {
  if (report.status !== "CRITICAL") return;
  if (!reportHasProductionRiskCritical(report)) return;
  if (!isInvestorDemoModeActive()) return;

  await disableDemoModeSafely("Dr. Brain detected CRITICAL system issue");
}
