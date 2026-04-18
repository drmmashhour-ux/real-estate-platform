#!/usr/bin/env npx tsx
/**
 * LECIPM FINAL PRE-LAUNCH VALIDATION v1
 *
 * From apps/web:
 *   pnpm prelaunch:final
 *
 * Requires a running Next server for HTTP phases unless VALIDATION_OFFLINE=1.
 *
 * Skips (optional):
 *   PRELAUNCH_SKIP_BUILD=1
 *   PRELAUNCH_SKIP_TSC=1
 *   PRELAUNCH_SKIP_PLATFORM=1
 *   PRELAUNCH_SKIP_SIMULATE=1
 *   VALIDATION_OFFLINE=1
 */
import { config } from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "../lib/db";
import { runFullPlatformSimulation } from "../modules/e2e-simulation/e2e-simulation.service";
import { executePlatformValidationV1 } from "../modules/validation/platform-validation-runner.service";
import {
  buildFeatureFlagRolloutPlan,
  computeFinalLaunchDecision,
  measurePrelaunchPerformance,
  runBuildGate,
  runDashboardProbes,
  runEnvValidation,
  runGrowthApiProbes,
  writeFinalLaunchReport,
  type FinalLaunchReportV1,
} from "../modules/prelaunch";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "../.env") });

async function main(): Promise<void> {
  const evidenceNote =
    "All checks use real commands and network calls where applicable. Growth GET APIs without PRELAUNCH_AUTH_COOKIE expect 401/403 (auth enforced). Enable PRELAUNCH_AUTH_COOKIE for full JSON responses.";

  const report: FinalLaunchReportV1 = {
    version: "lecipm-final-prelaunch-validation-v1",
    generatedAt: new Date().toISOString(),
    environment: runEnvValidation(),
    build: { steps: [], blockingFailures: [] },
    platformValidation: null,
    simulation: null,
    growthApis: [],
    performance: {},
    featureFlagRolloutPlan: buildFeatureFlagRolloutPlan(),
    dashboardUrlsProbed: [],
    decision: "NO_GO",
    blockers: [],
    warnings: [],
    evidenceNote,
  };

  const cwd = join(__dirname, "..");
  const skipBuild = process.env.PRELAUNCH_SKIP_BUILD === "1";
  const skipTsc = process.env.PRELAUNCH_SKIP_TSC === "1";
  const skipPlatform = process.env.PRELAUNCH_SKIP_PLATFORM === "1";
  const skipSim = process.env.PRELAUNCH_SKIP_SIMULATE === "1";

  if (!skipBuild) {
    report.build = runBuildGate({
      cwd,
      skipTsc,
      skipBuild: false,
    });
  } else {
    report.build = {
      steps: [{ step: "build_skipped", ok: false, durationMs: 0, severity: "warning", logTail: "PRELAUNCH_SKIP_BUILD=1" }],
      blockingFailures: [],
    };
    report.warnings.push("PRELAUNCH_SKIP_BUILD=1 — compile/build not verified; not sufficient for production sign-off.");
  }

  const buildOk = !skipBuild && report.build.blockingFailures.length === 0;

  if (!skipPlatform && buildOk) {
    try {
      report.platformValidation = await executePlatformValidationV1({ writeReports: true });
    } catch (e) {
      report.warnings.push(`platform_validation_threw:${e instanceof Error ? e.message : String(e)}`);
    }
  } else {
    if (!buildOk) report.warnings.push("platform_validation_skipped_due_to_build_failure");
    else report.warnings.push("PRELAUNCH_SKIP_PLATFORM=1");
  }

  const offline = process.env.VALIDATION_OFFLINE === "1";

  if (buildOk && !offline && !skipPlatform) {
    try {
      report.performance = await measurePrelaunchPerformance();
    } catch (e) {
      report.warnings.push(`performance:${e instanceof Error ? e.message : String(e)}`);
    }
    try {
      report.growthApis = await runGrowthApiProbes();
    } catch (e) {
      report.warnings.push(`growth_apis:${e instanceof Error ? e.message : String(e)}`);
    }
    try {
      report.dashboardUrlsProbed = await runDashboardProbes();
    } catch (e) {
      report.warnings.push(`dashboard_probes:${e instanceof Error ? e.message : String(e)}`);
    }
  } else {
    if (offline) report.warnings.push("VALIDATION_OFFLINE=1_http_phases_minimal");
  }

  try {
    if (buildOk && !skipSim) {
      try {
        report.simulation = await runFullPlatformSimulation({
          writeReports: true,
          executeLiveStripeBooking: process.env.PRELAUNCH_RUN_LIVE_STRIPE === "1",
        });
      } catch (e) {
        report.warnings.push(`simulation:${e instanceof Error ? e.message : String(e)}`);
      }
    } else {
      report.warnings.push(skipSim ? "PRELAUNCH_SKIP_SIMULATE=1" : "simulation_skipped_build_or_flag");
    }
  } finally {
    await prisma.$disconnect().catch(() => {});
  }

  const merged = computeFinalLaunchDecision(report);
  report.decision = merged.decision;
  report.blockers = merged.blockers;
  report.warnings = [...new Set([...report.warnings, ...merged.warnings])];

  const path = writeFinalLaunchReport(report);

  console.log("\n===========================================");
  console.log("LECIPM FINAL PRE-LAUNCH VALIDATION v1");
  console.log("===========================================");
  console.log(`Decision: ${report.decision}`);
  console.log(`Report: ${path}`);
  console.log("\nEnvironment:");
  for (const e of report.environment) {
    console.log(`  [${e.ok ? "OK" : "NO"}] ${e.id}: ${e.detail}`);
  }
  console.log("\nBuild:");
  for (const s of report.build.steps) {
    console.log(`  [${s.ok ? "OK" : "NO"}] ${s.step} (${s.durationMs}ms)`);
  }
  if (report.build.blockingFailures.length) {
    console.log("  Blocking:", report.build.blockingFailures.join(", "));
  }
  if (report.blockers.length) {
    console.log("\nBlockers:");
    for (const b of report.blockers) console.log(`  - ${b}`);
  }
  if (report.warnings.length) {
    console.log("\nWarnings:");
    for (const w of report.warnings) console.log(`  - ${w}`);
  }

  process.exit(report.decision === "NO_GO" ? 1 : 0);
}

void main().catch((e) => {
  console.error("[prelaunch-final] fatal:", e);
  process.exit(1);
});
