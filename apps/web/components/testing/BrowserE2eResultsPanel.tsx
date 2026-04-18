import type { UnifiedPlatformSimulationReport } from "@/modules/e2e-simulation/e2e-simulation.types";

type Props = {
  report: UnifiedPlatformSimulationReport;
};

export function BrowserE2eResultsPanel({ report }: Props) {
  const meta = report.browserPlaywright;
  const browserScenario = report.scenarios.find((s) => s.domain === "browser_e2e");

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6">
      <h2 className="text-lg font-semibold text-white">Browser E2E (Chromium)</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Playwright suite from <code className="text-zinc-400">tests/e2e</code>. PASS only when the browser actually ran
        tests; failures list comes from the JSON reporter.
      </p>

      {browserScenario ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-md border px-2 py-0.5 text-xs ${
              browserScenario.status === "PASS"
                ? "border-emerald-500/30 text-emerald-400"
                : browserScenario.status === "FAIL"
                  ? "border-red-500/30 text-red-400"
                  : "border-amber-500/30 text-amber-400"
            }`}
          >
            {browserScenario.status}
          </span>
          <span className="text-sm text-zinc-400">{browserScenario.scenarioName}</span>
        </div>
      ) : (
        <p className="mt-3 text-sm text-zinc-500">No browser_e2e scenario in report (unexpected).</p>
      )}

      {meta ? (
        <dl className="mt-4 grid gap-2 font-mono text-xs text-zinc-400 sm:grid-cols-2">
          <div>
            <dt className="text-zinc-600">Exit code</dt>
            <dd>{meta.exitCode}</dd>
          </div>
          <div>
            <dt className="text-zinc-600">Unexpected failures (Playwright)</dt>
            <dd>{meta.unexpected}</dd>
          </div>
          <div>
            <dt className="text-zinc-600">Expected passed</dt>
            <dd>{meta.expected}</dd>
          </div>
          <div>
            <dt className="text-zinc-600">Skipped</dt>
            <dd>{meta.skipped}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-zinc-600">Report JSON</dt>
            <dd className="break-all text-zinc-500">{meta.reportJsonPath}</dd>
          </div>
        </dl>
      ) : (
        <p className="mt-3 text-sm text-amber-200/90">
          Browser metadata missing — Playwright was skipped (<code className="text-zinc-400">E2E_SIMULATION_PLAYWRIGHT=0</code>)
          or the suite did not produce a report file.
        </p>
      )}

      {meta && meta.failedTitles.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-red-300">Failed scenarios / tests</h3>
          <ul className="mt-2 list-inside list-disc text-sm text-red-200/90">
            {meta.failedTitles.slice(0, 24).map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {meta && meta.stderrTail.length > 0 && meta.unexpected > 0 ? (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-zinc-500">Stderr / log tail</summary>
          <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-zinc-950 p-3 text-xs text-zinc-500">{meta.stderrTail}</pre>
        </details>
      ) : null}

      <p className="mt-4 text-xs text-zinc-600">
        Screenshots: Playwright <code className="text-zinc-500">screenshot: only-on-failure</code> in{" "}
        <code className="text-zinc-500">tests/e2e/playwright.config.ts</code> — check CI artifacts or local output.
      </p>
    </section>
  );
}
