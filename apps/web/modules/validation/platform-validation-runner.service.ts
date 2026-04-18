/**
 * Shared runner for platform validation v1 (used by CLI + pre-launch orchestrator).
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { assertStripeSecretsForScripts } from "@/lib/stripe/stripeEnvGate";
import { prisma } from "@/lib/db";
import { validateGuestSupabaseBookingsIntegrity } from "@/lib/bookings/validate-bookings-integrity";
import {
  decideLaunch,
  defaultApiProbes,
  discoverAllRoutes,
  getReportsDir,
  percentileMs,
  runApiProbe,
  runLaunchEventsGate,
  runSecurityProbes,
  summarizeRoutesByCategory,
  validatePage,
  writeValidationReports,
  type PlatformValidationReportV1,
} from "@/modules/validation";
import { allFlowDefinitions } from "@/tests/scenarios/flow-definitions";
import { runFlowScenario } from "@/tests/scenarios/run-flow-scenarios";

export type RunPlatformValidationV1Options = {
  writeReports?: boolean;
  /** When set, overrides process.env for this run only */
  envOverrides?: Partial<NodeJS.ProcessEnv>;
};

function applyEnvOverrides(overrides?: Partial<NodeJS.ProcessEnv>) {
  if (!overrides) return;
  for (const [k, v] of Object.entries(overrides)) {
    if (v !== undefined) process.env[k] = v;
  }
}

function baseUrl(): string {
  return (process.env.VALIDATION_BASE_URL ?? "http://127.0.0.1:3001").replace(/\/$/, "");
}

function uniqueStrings(xs: string[]): string[] {
  return [...new Set(xs)];
}

function collectSmokePaths(): string[] {
  const fromFlows = allFlowDefinitions.flatMap((f) => f.steps.map((s) => s.path));
  const critical = ["/en/ca", "/en/ca/listings", "/en/ca/bnhub", "/en/ca/search"];
  return uniqueStrings([...fromFlows, ...critical]);
}

export async function executePlatformValidationV1(
  opts: RunPlatformValidationV1Options = {},
): Promise<PlatformValidationReportV1> {
  applyEnvOverrides(opts.envOverrides);

  const offline = process.env.VALIDATION_OFFLINE === "1";
  const url = baseUrl();
  const mode = process.env.VALIDATION_PAGE_MODE === "full" ? "full" : "smoke";

  const report: PlatformValidationReportV1 = {
    meta: {
      version: "lecipm-platform-validation-v1",
      generatedAt: new Date().toISOString(),
      baseUrl: url,
      hostname: (() => {
        try {
          return new URL(url).hostname;
        } catch {
          return undefined;
        }
      })(),
      mode: offline ? "offline" : mode,
      evidenceNote:
        "HTTP probes use Node fetch (no browser console capture). Playwright E2E is separate. Failed network calls include error message.",
    },
    routeMapSummary: { totalDiscovered: 0, categories: {} },
    launchEvents: { ran: false, ready: false, counts: {}, issues: [] },
    pages: [],
    apis: [],
    security: [],
    scenarios: [],
    stripeBooking: { ran: false, ok: false },
    dataIntegrity: { ran: false, ok: true, issues: [] },
    performance: { slowWarnings: [] },
    launch: { decision: "NO_GO", reasons: [], blockers: [], warnings: [] },
  };

  const routes = discoverAllRoutes();
  report.routeMapSummary = {
    totalDiscovered: routes.length,
    categories: summarizeRoutesByCategory(routes),
  };

  const routeMapPath = join(getReportsDir(), "route-map.json");
  mkdirSync(dirname(routeMapPath), { recursive: true });
  writeFileSync(routeMapPath, JSON.stringify({ generatedAt: report.meta.generatedAt, routes }, null, 2), "utf8");

  const dbUrl = (process.env.DATABASE_URL ?? "").trim();
  if (!dbUrl) {
    report.launchEvents.issues.push("DATABASE_URL missing — launch_events gate skipped");
  } else {
    assertStripeSecretsForScripts();
    try {
      const gate = await runLaunchEventsGate(prisma);
      report.launchEvents = { ran: true, ready: gate.ready, counts: gate.counts, issues: gate.issues };
    } catch (e) {
      report.launchEvents = {
        ran: true,
        ready: false,
        counts: {},
        issues: [e instanceof Error ? e.message : String(e)],
      };
    }
  }

  if (!offline) {
    const pagePaths =
      mode === "full"
        ? uniqueStrings(
            routes
              .map((r) => r.exampleUrl)
              .filter((x): x is string => Boolean(x && !x.includes("__missing_"))),
          )
        : collectSmokePaths();

    const loadSamples: number[] = [];
    for (const path of pagePaths) {
      if (path.startsWith("/api/")) continue;
      // Locale marketing surfaces can cold-compile past the default 25s in dev (webpack).
      const criticalSlowPaths = new Set(["/en/ca", "/en/ca/listings", "/en/ca/search"]);
      // Cold webpack compile on first hit can exceed 60s in dev — keep probes infrastructure-only.
      const timeoutMs = criticalSlowPaths.has(path) ? 120_000 : undefined;
      const r = await validatePage({ baseUrl: url, path, allowAuthWall: true, timeoutMs });
      report.pages.push(r);
      if (r.loadTimeMs) loadSamples.push(r.loadTimeMs);
    }

    report.performance.pageP95Ms = percentileMs(loadSamples, 95);
    if (report.performance.pageP95Ms && report.performance.pageP95Ms > 8000) {
      report.performance.slowWarnings.push(`page_p95_${report.performance.pageP95Ms}ms`);
    }

    for (const probe of defaultApiProbes()) {
      report.apis.push(await runApiProbe(url, probe));
    }

    const apiTimes = report.apis.map((a) => a.responseTimeMs).filter((x): x is number => typeof x === "number");
    report.performance.apiP95Ms = percentileMs(apiTimes, 95);

    report.security = await runSecurityProbes(url);

    for (const flow of allFlowDefinitions) {
      report.scenarios.push(await runFlowScenario(url, flow));
    }
  } else {
    report.meta.evidenceNote += " VALIDATION_OFFLINE=1 — no HTTP probes executed.";
  }

  if (process.env.VALIDATION_RUN_STRIPE_E2E === "1" && !offline) {
    assertStripeSecretsForScripts();
    const r = spawnSync("pnpm", ["exec", "tsx", "scripts/validate-bnhub-stripe-e2e.ts"], {
      cwd: process.cwd(),
      stdio: "inherit",
      shell: process.platform === "win32",
      env: { ...process.env, BNHUB_STRIPE_E2E_BASE_URL: url },
    });
    report.stripeBooking = {
      ran: true,
      ok: r.status === 0,
      detail: r.status === 0 ? "exit_0" : `exit_${r.status ?? "null"}`,
    };
  }

  if (process.env.VALIDATION_SKIP_DATA_INTEGRITY === "1") {
    report.dataIntegrity = { ran: false, ok: true, issues: ["skipped_by_env"] };
  } else if (dbUrl) {
    const integ = await validateGuestSupabaseBookingsIntegrity({ limit: 2000 });
    report.dataIntegrity = {
      ran: true,
      ok: integ.ok,
      issues: integ.issues.map((i) => `${i.code}:${i.detail}`),
      scanned: integ.scanned,
    };
  }

  report.launch = decideLaunch(report);

  if (opts.writeReports !== false) {
    writeValidationReports(report);
  }

  return report;
}
