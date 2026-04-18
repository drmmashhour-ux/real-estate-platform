import { runLaunchReadinessChecks } from "@/lib/launch/readiness-checks";

export type LaunchReadinessResult = {
  status: "ready" | "not_ready";
  issues: { code: string; severity: string; message: string }[];
  recommendations: string[];
  checks: Awaited<ReturnType<typeof runLaunchReadinessChecks>>;
};

/**
 * Aggregate readiness — `ready` only when no blocking issues.
 */
export async function validateLaunchReadiness(): Promise<LaunchReadinessResult> {
  const checks = await runLaunchReadinessChecks();
  const blocking = checks.issues.filter((i) => i.severity === "blocking");
  const status = blocking.length === 0 && checks.dbOk && checks.i18nOk && checks.marketOk ? "ready" : "not_ready";
  return {
    status,
    issues: checks.issues,
    recommendations: checks.recommendations,
    checks,
  };
}
