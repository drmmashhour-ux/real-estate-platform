import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

import type {
  BrowserPlaywrightReportMeta,
  SimulationRunContext,
  SimulationScenarioResult,
  SimulationStepResult,
} from "./e2e-simulation.types";
import { scenarioRollup } from "./simulation-status.service";

let lastBrowserMeta: BrowserPlaywrightReportMeta | null = null;

/** Last Playwright run metadata (set by `runPlaywrightBrowserSimulation`). */
export function peekBrowserPlaywrightMeta(): BrowserPlaywrightReportMeta | null {
  return lastBrowserMeta;
}

function parsePlaywrightJsonReport(raw: string): {
  unexpected: number;
  expected: number;
  skipped: number;
  failedTitles: string[];
} {
  try {
    const j = JSON.parse(raw) as {
      stats?: { unexpected?: number; expected?: number; skipped?: number };
      suites?: unknown[];
    };
    const unexpected = j.stats?.unexpected ?? 0;
    const expected = j.stats?.expected ?? 0;
    const skipped = j.stats?.skipped ?? 0;
    const failedTitles: string[] = [];
    const walk = (suites: unknown[] | undefined, prefix: string) => {
      if (!Array.isArray(suites)) return;
      for (const s of suites) {
        if (typeof s !== "object" || !s) continue;
        const title = typeof (s as { title?: string }).title === "string" ? (s as { title: string }).title : "";
        const nextPrefix = prefix ? `${prefix} › ${title}` : title;
        const specs = (s as { specs?: unknown[] }).specs;
        if (Array.isArray(specs)) {
          for (const sp of specs) {
            if (typeof sp !== "object" || !sp) continue;
            const tests = (sp as { tests?: unknown[] }).tests;
            if (!Array.isArray(tests)) continue;
            for (const t of tests) {
              if (typeof t !== "object" || !t) continue;
              const results = (t as { results?: unknown[] }).results;
              const ttitle = typeof (t as { title?: string }).title === "string" ? (t as { title: string }).title : "test";
              if (Array.isArray(results)) {
                for (const r of results) {
                  if (typeof r !== "object" || !r) continue;
                  const status = (r as { status?: string }).status;
                  if (status === "failed" || status === "timedOut") {
                    failedTitles.push(`${nextPrefix} › ${ttitle}`.replace(/^ › /, ""));
                  }
                }
              }
            }
          }
        }
        walk((s as { suites?: unknown[] }).suites, nextPrefix);
      }
    };
    walk(j.suites, "");
    return { unexpected, expected, skipped, failedTitles };
  } catch {
    return { unexpected: -1, expected: 0, skipped: 0, failedTitles: ["parse_error"] };
  }
}

/**
 * Runs `pnpm exec playwright test -c tests/e2e/playwright.config.ts` against `ctx.baseUrl`.
 * Set `E2E_SIMULATION_PLAYWRIGHT=0` to skip (NOT_CONFIRMED). Default runs when unset in CI with server available.
 */
export async function runPlaywrightBrowserSimulation(
  ctx: SimulationRunContext
): Promise<{ scenario: SimulationScenarioResult; meta: BrowserPlaywrightReportMeta | null }> {
  lastBrowserMeta = null;

  if (process.env.E2E_SIMULATION_PLAYWRIGHT === "0") {
    const steps: SimulationStepResult[] = [
      {
        stepId: "pw-skip",
        title: "Playwright browser suite",
        status: "NOT_CONFIRMED",
        details: "Skipped (E2E_SIMULATION_PLAYWRIGHT=0)",
        routeOrService: "tests/e2e",
        evidence: "not run",
        frictionPoints: ["Set E2E_SIMULATION_PLAYWRIGHT=1 (default) with Next running"],
        blockers: [],
      },
    ];
    return {
      scenario: scenarioRollup({
        scenarioId: "browser-e2e-v1",
        scenarioName: "LECIPM Full Browser E2E (Playwright)",
        domain: "browser_e2e",
        steps,
        recommendations: ["Run with Next + DB + PRELAUNCH_TEST_PASSWORD for authenticated flows."],
      }),
      meta: null,
    };
  }


  const root = resolve(process.cwd());
  const reportPath = resolve(root, "tests/e2e/report/playwright-report.json");
  const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const env = {
    ...process.env,
    PLAYWRIGHT_BASE_URL: ctx.baseUrl.replace(/\/$/, ""),
    PLAYWRIGHT_SKIP_WEBSERVER: process.env.PLAYWRIGHT_SKIP_WEBSERVER ?? "1",
    CI: process.env.CI,
  };

  const r = spawnSync(
    pnpm,
    ["exec", "playwright", "test", "-c", "tests/e2e/playwright.config.ts"],
    {
      cwd: root,
      encoding: "utf8",
      env,
      timeout: 1_200_000,
    }
  );

  const exitCode = r.status ?? 1;
  const stderrTail = (r.stderr || r.stdout || "").slice(-6000);
  let parsed = { unexpected: 0, expected: 0, skipped: 0, failedTitles: [] as string[] };
  if (existsSync(reportPath)) {
    parsed = parsePlaywrightJsonReport(readFileSync(reportPath, "utf8"));
  }

  const meta: BrowserPlaywrightReportMeta = {
    exitCode,
    reportJsonPath: reportPath,
    unexpected: parsed.unexpected,
    expected: parsed.expected,
    skipped: parsed.skipped,
    failedTitles: parsed.failedTitles,
    stderrTail,
  };
  lastBrowserMeta = meta;

  const pass = exitCode === 0 && parsed.unexpected === 0;
  const steps: SimulationStepResult[] = [
    {
      stepId: "pw-1",
      title: "Playwright Chromium suite",
      status: pass ? "PASS" : "FAIL",
      details: pass ? `exit ${exitCode}, unexpected=${parsed.unexpected}` : `exit ${exitCode}; ${stderrTail.slice(0, 400)}`,
      routeOrService: "tests/e2e/*.spec.ts",
      evidence: JSON.stringify({ exitCode, unexpected: parsed.unexpected, failed: parsed.failedTitles.slice(0, 12) }),
      frictionPoints: pass ? [] : ["See tests/e2e/report/playwright-report.json"],
      blockers: pass ? [] : parsed.failedTitles.slice(0, 20),
    },
  ];

  return {
    scenario: scenarioRollup({
      scenarioId: "browser-e2e-v1",
      scenarioName: "LECIPM Full Browser E2E (Playwright)",
      domain: "browser_e2e",
      steps,
      recommendations: pass ? [] : ["Fix failing Playwright specs; ensure PRELAUNCH users seeded and E2E_PRELAUNCH_PASSWORD set."],
    }),
    meta,
  };
}
