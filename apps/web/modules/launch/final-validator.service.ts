/**
 * LECIPM Full Browser E2E Validation v1 — Stripe E2E, booking integrity, RLS, Playwright browser gate,
 * light performance, API health, optional typecheck.
 */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { verifyBookingIntegrity } from "@/modules/bookings/booking-integrity.service";
import { verifyRowLevelSecurity, type RlsVerificationResult } from "@/modules/launch/rls-verification.service";
import { runStripeBookingE2e, type StripeBookingE2eResult } from "@/modules/launch/stripe-booking-e2e.engine";
import { auditRowLevelSecurityEnabled, type RlsTableAuditRow } from "@/modules/security/rls-audit.service";
import { verifyRlsPoliciesAndAppLayerExpectations } from "@/modules/security/rls-policy-check.service";
import {
  verifyRlsTableMatrix,
  type RlsTableMatrixResult,
  type RlsTableMatrixRow,
} from "@/modules/security/rls-table-matrix.service";
import { runLightPerformanceCheck, type LightPerformanceResult } from "@/modules/performance/light-check.service";

export type GateLabel = "PASS" | "FAIL" | "WARNING" | "SKIPPED";

export type FinalLaunchValidationReport = {
  version: "LECIPM Full Browser E2E Validation v1";
  generatedAt: string;
  stripe: { status: GateLabel; detail: string; e2e?: StripeBookingE2eResult };
  bookingSample: { status: GateLabel; detail: string };
  webhookIdempotency: { status: GateLabel; detail: string };
  /** Legacy count-only probe (supplementary). */
  rls: RlsVerificationResult;
  /** Required-table RLS enablement (pg_class.relrowsecurity). */
  rlsAudit: { status: GateLabel; detail: string; tables: RlsTableAuditRow[] };
  /** Policy rows + Prisma bypass disclosure. */
  rlsPolicy: { status: GateLabel; detail: string; prbypassDetected: boolean };
  /** Per logical domain: RLS on + policy count (launch gate). */
  rlsTableMatrix: {
    overall: RlsTableMatrixResult["overall"];
    discovery: RlsTableMatrixResult["discovery"];
    tables: RlsTableMatrixRow[];
  };
  /** App-layer expectations (not a substitute for role-separated DB tests). */
  accessControl: { status: GateLabel; detail: string };
  playwright: { status: GateLabel; detail: string; exitCode?: number };
  /** Real login + role flows exercised when Playwright PASS (subset of specs). */
  browserAuth: { status: GateLabel; detail: string };
  performance: {
    status: GateLabel;
    detail: string;
    homepageMs?: number;
    apiReadyMs?: number;
    raw?: LightPerformanceResult;
  };
  build: { status: GateLabel; detail: string };
  api: { status: GateLabel; detail: string };
  overall: "GO" | "GO_WITH_WARNINGS" | "NO_GO";
};

function gateFromBool(ok: boolean, failDetail: string): { status: GateLabel; detail: string } {
  return ok ? { status: "PASS", detail: "ok" } : { status: "FAIL", detail: failDetail };
}

function runTypecheckQuick(): { ok: boolean; detail: string } {
  const root = resolve(process.cwd());
  const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const r = spawnSync(pnpm, ["run", "typecheck"], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, NODE_OPTIONS: process.env.NODE_OPTIONS ?? "--max-old-space-size=8192" },
  });
  if (r.status !== 0) {
    return { ok: false, detail: (r.stderr || r.stdout || "typecheck failed").slice(0, 2000) };
  }
  return { ok: true, detail: "pnpm run typecheck" };
}

async function checkApiReady(baseUrl: string): Promise<{ status: GateLabel; detail: string }> {
  const base = baseUrl.replace(/\/$/, "");
  try {
    const ctrl = typeof AbortSignal !== "undefined" && "timeout" in AbortSignal ? AbortSignal.timeout(12_000) : undefined;
    const res = await fetch(`${base}/api/ready`, { signal: ctrl });
    if (!res.ok) {
      return { status: "FAIL", detail: `HTTP ${res.status}` };
    }
    return { status: "PASS", detail: "GET /api/ready OK" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { status: "FAIL", detail: msg };
  }
}

function runPlaywrightLaunchFinal(baseUrl: string): { status: GateLabel; detail: string; exitCode?: number } {
  if (typeof process === "undefined" || process.env.LAUNCH_VALIDATION_PLAYWRIGHT !== "1") {
    return {
      status: "SKIPPED",
      detail:
        "Set LAUNCH_VALIDATION_PLAYWRIGHT=1 with Next reachable — PLAYWRIGHT_BASE_URL defaults from validator baseUrl (tests/e2e).",
    };
  }
  const root = resolve(process.cwd());
  const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const r = spawnSync(pnpm, ["exec", "playwright", "test", "-c", "tests/e2e/playwright.config.ts"], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      PLAYWRIGHT_BASE_URL: baseUrl.replace(/\/$/, ""),
      PLAYWRIGHT_SKIP_WEBSERVER: process.env.PLAYWRIGHT_SKIP_WEBSERVER ?? "1",
    },
    timeout: 900_000,
  });
  const exitCode = r.status ?? 1;
  const tail = (r.stderr || r.stdout || "").slice(-4000);
  if (exitCode === 0) {
    return { status: "PASS", detail: "Playwright tests/e2e suite passed", exitCode: 0 };
  }
  return {
    status: "FAIL",
    detail: `Playwright exited ${exitCode}: ${tail || "no output"}`,
    exitCode,
  };
}

export type RunFinalLaunchValidationOptions = {
  /** Real Stripe + DB + Next — slow; default from env LAUNCH_VALIDATION_RUN_STRIPE_E2E=1 */
  runStripeE2e?: boolean;
  /** Runs `pnpm run typecheck` (heavy). Default true. */
  runTypecheck?: boolean;
  baseUrl?: string;
  /** Locale path for homepage perf (default /en/ca). */
  localePath?: string;
  /**
   * When true (or env LAUNCH_REQUIRE_BROWSER_E2E=1 / LAUNCH_FULL_GO=1), Playwright must PASS — skipped or failed → NO_GO.
   */
  requireBrowserE2ePass?: boolean;
};

export async function runFinalLaunchValidation(
  opts: RunFinalLaunchValidationOptions = {}
): Promise<FinalLaunchValidationReport> {
  const runStripe =
    opts.runStripeE2e ??
    (typeof process !== "undefined" && process.env.LAUNCH_VALIDATION_RUN_STRIPE_E2E === "1");
  const runTc = opts.runTypecheck !== false;
  const baseUrl =
    opts.baseUrl?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.BNHUB_STRIPE_E2E_BASE_URL?.trim() ||
    process.env.PLAYWRIGHT_BASE_URL?.trim() ||
    "http://127.0.0.1:3001";
  const localePath = opts.localePath ?? "/en/ca";
  const requireBrowserPass =
    opts.requireBrowserE2ePass === true ||
    (typeof process !== "undefined" && process.env.LAUNCH_REQUIRE_BROWSER_E2E === "1") ||
    (typeof process !== "undefined" && process.env.LAUNCH_FULL_GO === "1");

  let e2eResult: StripeBookingE2eResult | undefined;
  let stripe: FinalLaunchValidationReport["stripe"];

  if (runStripe) {
    e2eResult = await runStripeBookingE2e({
      baseUrl,
      testDuplicateWebhook: true,
      skipCleanup: false,
    });
    stripe = {
      status: e2eResult.success ? "PASS" : "FAIL",
      detail: e2eResult.success ? "Stripe test-mode booking E2E passed" : e2eResult.errors.join("; ") || "e2e failed",
      e2e: e2eResult,
    };
  } else {
    stripe = {
      status: "SKIPPED",
      detail:
        "Set LAUNCH_VALIDATION_RUN_STRIPE_E2E=1 with Next running + sk_test + whsec to execute real Stripe booking E2E.",
    };
  }

  const webhookIdempotency: FinalLaunchValidationReport["webhookIdempotency"] =
    e2eResult && e2eResult.success
      ? {
          status: e2eResult.duplicateDetected ? "PASS" : "FAIL",
          detail: e2eResult.duplicateDetected
            ? "Second webhook returned duplicate:true; platformPayment count stable"
            : "Duplicate webhook did not short-circuit as expected",
        }
      : {
          status: "SKIPPED",
          detail: "Requires successful Stripe E2E",
        };

  let bookingSample: FinalLaunchValidationReport["bookingSample"] = {
    status: "SKIPPED",
    detail: "Run with LAUNCH_VALIDATION_RUN_STRIPE_E2E=1 to verify booking + payment rows",
  };
  if (e2eResult?.success && !e2eResult.bookingId) {
    bookingSample = {
      status: "PASS",
      detail: "E2E passed (integrity checked before cleanup; booking removed after test)",
    };
  } else if (e2eResult?.success && e2eResult.bookingId) {
    const integ = await verifyBookingIntegrity(e2eResult.bookingId);
    bookingSample = integ.ok
      ? { status: "PASS", detail: `integrity ok for ${e2eResult.bookingId}` }
      : { status: "FAIL", detail: (integ as { issues: string[] }).issues.join(", ") };
  } else if (e2eResult && !e2eResult.success) {
    bookingSample = { status: "FAIL", detail: "E2E failed before integrity" };
  }

  const rls = await verifyRowLevelSecurity();

  const [audit, matrix, policy] = await Promise.all([
    auditRowLevelSecurityEnabled(),
    verifyRlsTableMatrix(),
    verifyRlsPoliciesAndAppLayerExpectations(),
  ]);

  const rlsAudit: FinalLaunchValidationReport["rlsAudit"] = {
    status: audit.status === "PASS" ? "PASS" : "FAIL",
    detail: audit.message,
    tables: audit.tables,
  };

  const rlsTableMatrix: FinalLaunchValidationReport["rlsTableMatrix"] = {
    overall: matrix.overall,
    discovery: matrix.discovery,
    tables: matrix.tables,
  };

  const rlsPolicy: FinalLaunchValidationReport["rlsPolicy"] = {
    status: policy.status === "FAIL" ? "FAIL" : policy.status === "WARNING" ? "WARNING" : "PASS",
    detail: policy.message,
    prbypassDetected: policy.prbypassDetected,
  };

  const accessControl: FinalLaunchValidationReport["accessControl"] =
    matrix.overall === "FAIL" || policy.status === "FAIL" || audit.status === "FAIL"
      ? {
          status: "FAIL",
          detail:
            "RLS audit, table matrix, or policy check failed — apply apps/web/sql/supabase/enable-rls.sql and rls-policies.sql; keep API guards.",
        }
      : matrix.overall === "PASS" && policy.status === "PASS" && audit.status === "PASS"
        ? {
            status: "PASS",
            detail:
              "Critical tables: RLS enabled with policies (sql/supabase/). Prisma service role still bypasses RLS — modules/security/access-guard.service.ts remains required.",
          }
        : {
            status: "WARNING",
            detail:
              "RLS partially deployed or unverified — complete sql/supabase/*.sql; app-layer guards in modules/security/access-guard.service.ts remain mandatory.",
          };

  const playwright = runPlaywrightLaunchFinal(baseUrl);

  const browserAuth: FinalLaunchValidationReport["browserAuth"] =
    playwright.status === "PASS"
      ? {
          status: "PASS",
          detail: "Chromium E2E passed — includes real /api/auth/login sessions where specs are unskipped.",
        }
      : playwright.status === "FAIL"
        ? { status: "FAIL", detail: "Playwright failed — auth/UI flows not fully validated." }
        : {
            status: "SKIPPED",
            detail: "Playwright not run — set LAUNCH_VALIDATION_PLAYWRIGHT=1 (+ E2E_PRELAUNCH_PASSWORD + seeded users).",
          };

  const perfRaw = await runLightPerformanceCheck(baseUrl, localePath);
  const performance: FinalLaunchValidationReport["performance"] = {
    status: perfRaw.status === "PASS" ? "PASS" : perfRaw.status === "WARNING" ? "WARNING" : "FAIL",
    detail: perfRaw.detail,
    homepageMs: perfRaw.homepageMs,
    apiReadyMs: perfRaw.apiReadyMs,
    raw: perfRaw,
  };

  const tc = runTc ? runTypecheckQuick() : null;
  const build: FinalLaunchValidationReport["build"] = tc
    ? gateFromBool(tc.ok, tc.detail)
    : { status: "SKIPPED", detail: "Set runTypecheck:true to run pnpm run typecheck" };

  const api = await checkApiReady(baseUrl);

  const browserGateFailed =
    requireBrowserPass && (playwright.status === "FAIL" || playwright.status === "SKIPPED");

  const hardFail =
    stripe.status === "FAIL" ||
    webhookIdempotency.status === "FAIL" ||
    bookingSample.status === "FAIL" ||
    build.status === "FAIL" ||
    api.status === "FAIL" ||
    rlsAudit.status === "FAIL" ||
    rlsPolicy.status === "FAIL" ||
    matrix.overall === "FAIL" ||
    performance.status === "FAIL" ||
    playwright.status === "FAIL" ||
    browserGateFailed;

  const paymentProven = stripe.status === "PASS";
  const warnStripeOrWebhookSkipped = stripe.status === "SKIPPED" || webhookIdempotency.status === "SKIPPED";
  const warnRlsLegacy = rls.status === "WARNING";
  const warnRlsMatrix = matrix.overall === "WARNING";
  const warnRlsPolicyDb = rlsPolicy.status === "WARNING";
  const warnAccessControl = accessControl.status === "WARNING";
  const warnBookingSkipped = bookingSample.status === "SKIPPED";
  const warnBuildSkipped = build.status === "SKIPPED";
  const warnPlaywrightSkipped = playwright.status === "SKIPPED";
  const warnPerf = performance.status === "WARNING";

  let overall: FinalLaunchValidationReport["overall"] = "NO_GO";
  if (hardFail) {
    overall = "NO_GO";
  } else if (!paymentProven) {
    overall = "GO_WITH_WARNINGS";
  } else if (
    warnRlsLegacy ||
    warnRlsMatrix ||
    warnRlsPolicyDb ||
    warnAccessControl ||
    warnStripeOrWebhookSkipped ||
    warnBookingSkipped ||
    warnBuildSkipped ||
    warnPlaywrightSkipped ||
    warnPerf
  ) {
    overall = "GO_WITH_WARNINGS";
  } else {
    overall = "GO";
  }

  return {
    version: "LECIPM Full Browser E2E Validation v1",
    generatedAt: new Date().toISOString(),
    stripe,
    bookingSample,
    webhookIdempotency,
    rls,
    rlsAudit,
    rlsPolicy,
    rlsTableMatrix,
    accessControl,
    playwright,
    browserAuth,
    performance,
    build,
    api: { status: api.status as GateLabel, detail: api.detail },
    overall,
  };
}
