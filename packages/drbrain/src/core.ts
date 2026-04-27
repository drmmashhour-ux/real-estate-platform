import { join } from "node:path";
import { normalizeAppEnv } from "@repo/db/env-guard";
import { sendDrBrainAlert } from "./alerts";
import { runAnomalyChecks } from "./checks/anomalies";
import { runBuildChecks } from "./checks/build";
import { runDatabaseChecks } from "./checks/database";
import { runEnvIsolationChecks } from "./checks/env";
import { runPaymentsChecks } from "./checks/payments";
import { runPerformanceChecks } from "./checks/performance";
import { runSecurityChecks } from "./checks/security";
import { buildRecommendations } from "./recommendations";
import type { DrBrainEnv, DrBrainReport, DrBrainCheckResult, RunDrBrainForAppInput } from "./types";
import { syncTicketsFromReport } from "./tickets";

export function deriveReportStatus(results: DrBrainCheckResult[]): DrBrainReport["status"] {
  if (results.some((r) => r.level === "CRITICAL")) return "CRITICAL";
  if (results.some((r) => r.level === "WARNING")) return "WARNING";
  return "OK";
}

function deriveAppEnv(env: Record<string, string | undefined>): DrBrainEnv {
  return normalizeAppEnv(env.APP_ENV, env.NODE_ENV);
}

function hasPaymentsCritical(results: DrBrainCheckResult[]): boolean {
  return results.some((r) => r.check.startsWith("payments.") && r.level === "CRITICAL");
}

/**
 * Runs DR.BRAIN checks for one app using an isolated env snapshot and optional hooks.
 * Never logs raw DATABASE_URL — callers must not attach secrets to metadata.
 */
export async function runDrBrainForApp(input: RunDrBrainForAppInput): Promise<DrBrainReport> {
  const flags = input.flags ?? {};
  const results: DrBrainCheckResult[] = [];

  results.push(...(await runEnvIsolationChecks({ appId: input.appId, env: input.env })));
  results.push(...(await runDatabaseChecks({ appId: input.appId, dbPing: input.dbPing })));

  if (!flags.skipPayments) {
    results.push(...runPaymentsChecks({ appId: input.appId, env: input.env }));
  }

  results.push(...runSecurityChecks({ appId: input.appId }));

  if (!flags.skipPerformance) {
    results.push(...runPerformanceChecks({ appId: input.appId }));
  }

  results.push(...(await runAnomalyChecks({ appId: input.appId, anomalyChecks: input.anomalyChecks })));

  const wp = input.workspacePaths;
  if (!flags.skipBuild && wp) {
    results.push(
      ...runBuildChecks({
        appId: input.appId,
        appRootAbsolute: join(wp.monorepoRoot, wp.appRelativeDir),
      }),
    );
  } else {
    results.push({
      appId: input.appId,
      check: "build.skipped",
      level: "INFO",
      ok: true,
      message: flags.skipBuild
        ? "Build/typecheck skipped via flags.skipBuild."
        : "Build/typecheck skipped — workspacePaths not supplied.",
    });
  }

  const status = deriveReportStatus(results);
  const recommendations = buildRecommendations(results);

  const draftReport: DrBrainReport = {
    appId: input.appId,
    appEnv: deriveAppEnv(input.env),
    status,
    results,
    recommendations,
    timestamp: new Date().toISOString(),
  };

  const ticketsEmitted =
    flags.skipTickets || flags.drbrainInvestorDemoMode ? [] : syncTicketsFromReport(draftReport);

  let runtimeKillArmed = false;
  if (
    !flags.disableRuntimeKillSwitchArming &&
    !flags.drbrainInvestorDemoMode &&
    input.appId === "syria" &&
    hasPaymentsCritical(results) &&
    process.env.DRBRAIN_RUNTIME_KILL_SWITCH_AUTO === "true"
  ) {
    process.env.SYBNB_PAYMENTS_KILL_SWITCH = "true";
    process.env.SYBNB_PAYOUTS_KILL_SWITCH = "true";
    runtimeKillArmed = true;
  }

  const report: DrBrainReport = {
    ...draftReport,
    ticketsEmitted,
  };

  if (!flags.drbrainInvestorDemoMode && status === "CRITICAL") {
    await sendDrBrainAlert({
      appId: input.appId,
      severity: "critical",
      title: "DR.BRAIN CRITICAL",
      message: "One or more checks reported CRITICAL severity.",
      metadata: {
        checks: results.filter((r) => r.level === "CRITICAL").map((r) => r.check),
        runtimeKillSwitchArmed: runtimeKillArmed,
      },
    });
  } else if (!flags.drbrainInvestorDemoMode && status === "WARNING") {
    await sendDrBrainAlert({
      appId: input.appId,
      severity: "warning",
      title: "DR.BRAIN WARNING",
      message: "Warnings detected — review before rollout.",
      metadata: {
        checks: results.filter((r) => r.level === "WARNING").map((r) => r.check),
      },
    });
  }

  return report;
}
