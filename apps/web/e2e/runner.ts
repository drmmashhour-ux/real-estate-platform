import type { Page } from "@playwright/test";
import { writeLatestRunAndSummary } from "./failures/e2e-summary";
import type { E2EFailureRecord } from "./failures/types";
import { processScenarioFailure } from "./failures/process-failure";
import { slugForScenarioId } from "./failures/rerun-scenario";
import type { ScenarioContext, ScenarioResult, SharedE2EState } from "./scenarios/_context";
import { getOrigin } from "./scenarios/_context";
import { scenario1OnlineBooking } from "./scenarios/scenario-1-online-booking";
import { scenario2SyriaManual } from "./scenarios/scenario-2-syria-manual";
import { scenario3ArabicRtl } from "./scenarios/scenario-3-arabic-rtl";
import { scenario4French } from "./scenarios/scenario-4-french";
import { scenario5HostListing } from "./scenarios/scenario-5-host-listing";
import { scenario6AiRecommendations } from "./scenarios/scenario-6-ai";
import { scenario7AdminPayment } from "./scenarios/scenario-7-admin-payment";
import { scenario8Cancel } from "./scenarios/scenario-8-cancel";
import { scenario9Error } from "./scenarios/scenario-9-error";
import { scenario10Mixed } from "./scenarios/scenario-10-mixed";
import { countGrowthFunnelEventsSince, summarizeFunnelFromSnapshot } from "./utils/growth-metrics";
import { e2eScenarioStart, e2eStep } from "./utils/logger";
import { isInfraConnectionError } from "./utils/infra";

const SCENARIO_NAMES = [
  "Scenario 1 — online booking (EN, Stripe)",
  "Scenario 2 — Syria manual",
  "Scenario 3 — Arabic RTL",
  "Scenario 4 — French",
  "Scenario 5 — host listing",
  "Scenario 6 — AI / autopilot",
  "Scenario 7 — admin manual payment",
  "Scenario 8 — cancellation",
  "Scenario 9 — error recovery",
  "Scenario 10 — mixed market / locale",
] as const;

const SCENARIOS: Array<(ctx: ScenarioContext) => Promise<ScenarioResult>> = [
  scenario1OnlineBooking,
  scenario2SyriaManual,
  scenario3ArabicRtl,
  scenario4French,
  scenario5HostListing,
  scenario6AiRecommendations,
  scenario7AdminPayment,
  scenario8Cancel,
  scenario9Error,
  scenario10Mixed,
];

export type LaunchReportGrowth = Awaited<ReturnType<typeof countGrowthFunnelEventsSince>>;

/**
 * Runs all LECIPM Manager launch validation scenarios in order.
 * Shared `state` allows optional chaining between steps.
 */
export async function runAllScenarios(page: Page): Promise<ScenarioResult[]> {
  const runStartedAt = new Date();
  const origin = getOrigin();
  const state: SharedE2EState = {};
  const ctx: ScenarioContext = { page, origin, state };
  const results: ScenarioResult[] = [];
  const failureRecords: E2EFailureRecord[] = [];

  e2eStep("run_all_start", { origin, count: SCENARIOS.length, growthSince: runStartedAt.toISOString() });

  for (let i = 0; i < SCENARIOS.length; i++) {
    const fn = SCENARIOS[i];
    const id = i + 1;
    const label = `scenario_${id}`;
    const title = SCENARIO_NAMES[i] ?? label;
    const slug = slugForScenarioId(id) ?? `scenario-${id}-unknown`;
    e2eScenarioStart(id, title);
    e2eStep("run_all_enter", { label });
    try {
      const r = await fn(ctx);
      results.push(r);
      e2eStep("run_all_exit", { label, status: r.status });
      if (r.status !== "PASS") {
        failureRecords.push(
          processScenarioFailure({
            scenarioId: id,
            scenarioSlug: slug,
            scenarioDisplayName: title,
            result: r,
            ctx,
            stackTrace: r.criticalBugs[0],
          }),
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const stackTrace = e instanceof Error ? e.stack ?? null : null;
      const infra = isInfraConnectionError(msg);
      const r: ScenarioResult = {
        id,
        name: title,
        status: infra ? "BLOCKED" : "FAIL",
        detail: infra ? `App not reachable (${msg.slice(0, 120)})` : msg,
        failedSteps: [msg],
        criticalBugs: infra ? [] : [msg],
      };
      results.push(r);
      failureRecords.push(
        processScenarioFailure({
          scenarioId: id,
          scenarioSlug: slug,
          scenarioDisplayName: title,
          result: r,
          ctx,
          stackTrace,
        }),
      );
      e2eStep("run_all_crash", { label, msg, infra });
    }
  }

  let growth: LaunchReportGrowth | null = null;
  try {
    growth = await countGrowthFunnelEventsSince(runStartedAt);
  } catch (e) {
    e2eStep("growth_metrics_skipped", { reason: e instanceof Error ? e.message : String(e) });
  }

  printE2ELaunchReport(results, growth);
  try {
    writeLatestRunAndSummary({ results, failureRecords });
    e2eStep("e2e_reports_written", { failures: failureRecords.length });
  } catch (repErr) {
    e2eStep("e2e_reports_write_skipped", { reason: repErr instanceof Error ? repErr.message : String(repErr) });
  }
  console.log("ALL SCENARIOS FINISHED (see E2E LAUNCH REPORT below)");
  return results;
}

export { runSingleScenarioById } from "./failures/rerun-scenario";

/** Alias matching the requested runner shape. */
export const runAll = runAllScenarios;

export function printE2ELaunchReport(
  results: ScenarioResult[],
  growth: LaunchReportGrowth | null = null,
): void {
  const lines: string[] = [];
  lines.push("");
  lines.push("═══════════════════════════════════════════════════════════");
  lines.push(" === E2E LAUNCH REPORT — LECIPM Manager (real APIs / DB) ===");
  lines.push("═══════════════════════════════════════════════════════════");

  for (const r of results) {
    lines.push(`Scenario ${r.id}: ${r.status} — ${r.name}`);
    if (r.detail) lines.push(`  detail: ${r.detail}`);
  }

  const failedSteps: string[] = [];
  const bugs: string[] = [];
  for (const r of results) {
    for (const s of r.failedSteps) failedSteps.push(`[S${r.id}] ${s}`);
    for (const b of r.criticalBugs) bugs.push(`[S${r.id}] ${b}`);
  }

  lines.push("");
  lines.push("Failures:");
  lines.push(failedSteps.length ? failedSteps.map((s) => `  - ${s}`).join("\n") : "  (none)");

  lines.push("");
  lines.push("Critical Issues:");
  lines.push(bugs.length ? bugs.map((s) => `  - ${s}`).join("\n") : "  (none)");

  lines.push("");
  lines.push("Growth Metrics (growth_funnel_events since run start):");
  if (growth) {
    const funnel = summarizeFunnelFromSnapshot(growth);
    lines.push(`  total_events: ${growth.totalEvents}`);
    lines.push(
      `  funnel_hint: listing_views~${funnel.listingViews} booking_signals~${funnel.bookingSignals} checkout/payment~${funnel.checkoutOrPayment} manual/confirmed~${funnel.manualOrConfirmed}`,
    );
    const keys = Object.keys(growth.byEventName).sort();
    for (const k of keys) {
      lines.push(`  ${k}: ${growth.byEventName[k]}`);
    }
  } else {
    lines.push("  (unavailable — check DATABASE_URL / Prisma)");
  }

  const pass = results.filter((r) => r.status === "PASS").length;
  const fail = results.filter((r) => r.status === "FAIL").length;
  const blocked = results.filter((r) => r.status === "BLOCKED").length;
  lines.push("");
  lines.push("Admin summary:");
  lines.push(`  pass: ${pass}  fail: ${fail}  blocked: ${blocked}`);
  if (growth && growth.totalEvents > 0) {
    const online = growth.byEventName["payment_completed"] ?? 0;
    const manual = growth.byEventName["manual_payment_marked_received"] ?? 0;
    lines.push(`  online_payment_signals (payment_completed): ${online}`);
    lines.push(`  manual_payment_signals (manual_payment_marked_received): ${manual}`);
    lines.push(`  locale_switched: ${growth.byEventName["language_switched"] ?? 0}`);
    lines.push(`  market_switched: ${growth.byEventName["market_mode_used"] ?? 0}`);
    lines.push(`  ai_suggestion_used: ${growth.byEventName["ai_suggestion_accepted"] ?? 0}`);
  }

  const hardFail = results.some((r) => r.status === "FAIL");
  const hasBlocked = results.some((r) => r.status === "BLOCKED");
  const rec = hardFail
    ? "NOT READY"
    : hasBlocked
      ? "CONDITIONAL — resolve BLOCKED (env / Stripe / admin)"
      : "SAFE TO LAUNCH";

  lines.push("");
  lines.push("Recommendation:");
  lines.push(`  ${rec}`);
  lines.push("═══════════════════════════════════════════════════════════");
  lines.push("");

  console.log(lines.join("\n"));
}
