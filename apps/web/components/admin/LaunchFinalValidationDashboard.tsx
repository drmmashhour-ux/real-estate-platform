import type { FinalLaunchValidationReport } from "@/modules/launch/final-validator.service";

function badge(status: string) {
  if (status === "PASS" || status === "GO") return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  if (status === "FAIL" || status === "NO_GO") return "text-red-400 bg-red-500/10 border-red-500/30";
  if (status === "WARNING" || status === "GO_WITH_WARNINGS")
    return "text-amber-400 bg-amber-500/10 border-amber-500/30";
  return "text-zinc-400 bg-zinc-800 border-zinc-700";
}

type Props = {
  report: FinalLaunchValidationReport;
};

export function LaunchFinalValidationDashboard({ report }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">{report.version}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Generated {report.generatedAt}. Payment proof requires a successful Stripe test-mode E2E — not inferred from
          traffic alone. RLS audit reads pg_class; Prisma connections still bypass RLS.
        </p>
      </div>

      <div
        className={`rounded-2xl border px-4 py-3 text-lg font-semibold ${
          report.overall === "GO"
            ? badge("PASS")
            : report.overall === "GO_WITH_WARNINGS"
              ? badge("WARNING")
              : badge("FAIL")
        }`}
      >
        Decision: {report.overall}
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <GateCard title="Stripe E2E (test mode)" status={report.stripe.status} detail={report.stripe.detail} />
        <GateCard title="Webhook idempotency" status={report.webhookIdempotency.status} detail={report.webhookIdempotency.detail} />
        <GateCard title="Booking verification" status={report.bookingSample.status} detail={report.bookingSample.detail} />
        <GateCard title="RLS audit (critical tables)" status={report.rlsAudit.status} detail={report.rlsAudit.detail} />
        <GateCard
          title="RLS table matrix (RLS + policy count)"
          status={report.rlsTableMatrix.overall}
          detail={
            report.rlsTableMatrix.overall === "PASS"
              ? "All critical domains have RLS on and ≥1 policy."
              : report.rlsTableMatrix.tables.find((t) => t.status !== "PASS")?.detail ??
                "See matrix below for blocking tables."
          }
        />
        <GateCard title="RLS policies + bypass note" status={report.rlsPolicy.status} detail={report.rlsPolicy.detail} />
        <GateCard title="Access control (app layer)" status={report.accessControl.status} detail={report.accessControl.detail} />
        <GateCard title="Playwright (browser E2E)" status={report.playwright.status} detail={report.playwright.detail} />
        <GateCard title="Browser auth / UI (real login)" status={report.browserAuth.status} detail={report.browserAuth.detail} />
        <GateCard title="Performance (light)" status={report.performance.status} detail={report.performance.detail} />
        <GateCard title="RLS legacy count" status={report.rls.status} detail={report.rls.message} />
        <GateCard title="Typecheck" status={report.build.status} detail={report.build.detail} />
        <GateCard title="API /api/ready" status={report.api.status} detail={report.api.detail} />
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-zinc-300">RLS table matrix (policies + relrowsecurity)</h2>
          <span className={`rounded-md border px-2 py-0.5 text-xs ${badge(report.rlsTableMatrix.overall)}`}>
            {report.rlsTableMatrix.overall}
          </span>
        </div>
        <p className="mt-1 font-mono text-[11px] text-zinc-600">
          Discovery: {report.rlsTableMatrix.discovery.version} — {report.rlsTableMatrix.discovery.source}
        </p>
        <ul className="mt-3 space-y-2 font-mono text-xs">
          {report.rlsTableMatrix.tables.map((t) => (
            <li
              key={t.logical}
              className={`rounded-lg border px-3 py-2 ${
                t.status === "PASS" ? "border-zinc-800 bg-zinc-950/60" : "border-red-900/50 bg-red-950/20"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-zinc-300">
                <span>
                  {t.logical} → <span className="text-zinc-500">{t.physicalName}</span>
                </span>
                <span className={t.status === "PASS" ? "text-emerald-400/90" : "text-red-400"}>{t.status}</span>
              </div>
              <div className="mt-1 text-[11px] text-zinc-500">
                RLS: {t.rlsEnabled ? "on" : "off"} · policies: {t.policyCount}
              </div>
              {t.status !== "PASS" ? <div className="mt-1 text-[11px] text-red-300/90">{t.detail}</div> : null}
            </li>
          ))}
        </ul>
        {report.rlsTableMatrix.overall === "FAIL" ? (
          <p className="mt-3 text-sm text-red-400">
            Launch blocked: fix failing rows above (run apps/web/sql/supabase/enable-rls.sql then rls-policies.sql), then{" "}
            <code className="text-zinc-400">pnpm run verify:rls</code>.
          </p>
        ) : null}
      </section>

      {report.rlsAudit.tables.length > 0 ? (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
          <h2 className="text-sm font-medium text-zinc-300">RLS audit (relrowsecurity only)</h2>
          <ul className="mt-2 space-y-1 font-mono text-xs text-zinc-500">
            {report.rlsAudit.tables.map((t) => (
              <li key={t.logical}>
                {t.logical} → {t.physicalName}: {t.relrowsecurity ? "ON" : "OFF"}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {report.stripe.e2e ? (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6">
          <h2 className="text-lg font-semibold text-white">Stripe E2E steps</h2>
          <ul className="mt-3 space-y-1 font-mono text-xs text-zinc-400">
            {report.stripe.e2e.steps.map((s) => (
              <li key={s.name}>
                {s.ok ? "✓" : "✗"} {s.name}
                {s.detail ? ` — ${s.detail}` : ""}
              </li>
            ))}
          </ul>
          {report.stripe.e2e.errors.length > 0 ? (
            <ul className="mt-2 list-inside list-disc text-sm text-red-400">
              {report.stripe.e2e.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-2xl border border-amber-900/40 bg-amber-950/20 p-6 text-sm text-zinc-400">
        <p className="font-medium text-amber-200">How to run a full gate locally</p>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-zinc-950 p-3 text-xs text-zinc-300">
          {`# Terminal 1: Next + same DATABASE_URL as CLI
pnpm dev

# Terminal 2:
cd apps/web
LAUNCH_VALIDATION_RUN_STRIPE_E2E=1 pnpm exec tsx scripts/run-final-launch-validator.ts

# Browser E2E (requires server up; set PLAYWRIGHT_BASE_URL if not localhost:3001):
LAUNCH_VALIDATION_PLAYWRIGHT=1 PLAYWRIGHT_SKIP_WEBSERVER=1 pnpm exec tsx scripts/run-final-launch-validator.ts

# Or Stripe booking only:
pnpm exec tsx scripts/e2e-stripe-booking-test.ts

# Build + typecheck + prisma:
pnpm exec tsx scripts/full-validation.ts

# RLS only (same DATABASE_URL as app):
pnpm run verify:rls

# Full CLI launch report (Stripe + Playwright optional):
LAUNCH_VALIDATION_RUN_STRIPE_E2E=1 LAUNCH_VALIDATION_PLAYWRIGHT=1 pnpm exec tsx scripts/run-final-launch-validator.ts`}
        </pre>
      </section>
    </div>
  );
}

function GateCard(props: { title: string; status: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium text-white">{props.title}</h3>
        <span className={`rounded-md border px-2 py-0.5 text-xs ${badge(props.status)}`}>{props.status}</span>
      </div>
      <p className="mt-2 text-sm text-zinc-500">{props.detail}</p>
    </div>
  );
}
