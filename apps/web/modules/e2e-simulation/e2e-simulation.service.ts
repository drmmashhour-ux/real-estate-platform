import type { SimulationRunContext, UnifiedPlatformSimulationReport } from "./e2e-simulation.types";
import { peekBrowserPlaywrightMeta } from "./playwright-browser.service";
import { computeLaunchDecision, extractCriticalBlockers, extractWarnings } from "./launch-decision.service";
import { writeUnifiedSimulationReports } from "./simulation-report.service";
import { runOrderedPlatformSimulations } from "./simulation-runner.service";
import { simulationLog, clearSimulationLogs } from "./simulation-logger.service";

export type RunFullPlatformSimulationOptions = {
  baseUrl?: string;
  locale?: string;
  country?: string;
  executeLiveStripeBooking?: boolean;
  executeMobileDeepChecks?: boolean;
  writeReports?: boolean;
};

export async function runFullPlatformSimulation(
  opts: RunFullPlatformSimulationOptions = {}
): Promise<UnifiedPlatformSimulationReport> {
  clearSimulationLogs();
  const generatedAt = new Date().toISOString();
  const baseUrl =
    opts.baseUrl?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.BNHUB_STRIPE_E2E_BASE_URL?.trim() ||
    "http://127.0.0.1:3001";

  const executeLiveStripeBooking =
    opts.executeLiveStripeBooking ??
    (process.env.E2E_SIMULATION_LIVE_STRIPE === "1" || process.env.LAUNCH_VALIDATION_RUN_STRIPE_E2E === "1");

  const ctx: SimulationRunContext = {
    baseUrl,
    locale: opts.locale?.trim() || process.env.E2E_SIMULATION_LOCALE?.trim() || "en",
    country: opts.country?.trim() || process.env.E2E_SIMULATION_COUNTRY?.trim() || "ca",
    executeLiveStripeBooking: Boolean(executeLiveStripeBooking),
    executeMobileDeepChecks: opts.executeMobileDeepChecks ?? process.env.E2E_SIMULATION_MOBILE_DEEP === "1",
    generatedAt,
  };

  simulationLog("info", "Starting full platform simulation", { baseUrl: ctx.baseUrl, executeLiveStripeBooking: ctx.executeLiveStripeBooking });

  const scenarios = await runOrderedPlatformSimulations(ctx);

  const criticalBlockers = extractCriticalBlockers(scenarios);
  const warnings = extractWarnings(scenarios);

  const recommendedFixesPriority: string[] = [];
  for (const s of scenarios) {
    recommendedFixesPriority.push(...s.recommendations);
  }
  if (criticalBlockers.length) {
    recommendedFixesPriority.unshift("Resolve critical FAIL steps before launch (see JSON report).");
  }

  const browserPlaywright = peekBrowserPlaywrightMeta();

  const report: UnifiedPlatformSimulationReport = {
    version: "LECIPM Full Browser E2E Validation v1",
    generatedAt,
    context: {
      baseUrl: ctx.baseUrl,
      locale: ctx.locale,
      country: ctx.country,
      executeLiveStripeBooking: ctx.executeLiveStripeBooking,
      executeMobileDeepChecks: ctx.executeMobileDeepChecks,
    },
    scenarios,
    criticalBlockers,
    warnings,
    recommendedFixesPriority: [...new Set(recommendedFixesPriority)].slice(0, 40),
    decision: "NO_GO",
    browserPlaywright,
  };

  report.decision = computeLaunchDecision(report);

  if (opts.writeReports !== false) {
    writeUnifiedSimulationReports(report);
  }

  simulationLog("info", "Simulation complete", { decision: report.decision });
  return report;
}
