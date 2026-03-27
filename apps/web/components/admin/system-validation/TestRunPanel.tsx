"use client";

type Props = {
  running: boolean;
  onRun: (opts: { skipScaling: boolean }) => void;
  lastError: string | null;
};

export function TestRunPanel({ running, onRun, lastError }: Props) {
  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
      <h2 className="text-lg font-semibold text-slate-100">Test run</h2>
      <p className="mt-1 text-sm text-slate-400">
        Requires <code className="text-amber-200/90">TEST_MODE=true</code> and a non-production database. Uses{" "}
        <code className="text-amber-200/90">SYSTEM_VALIDATION_USER_PASSWORD</code> for fixture users.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={running}
          onClick={() => onRun({ skipScaling: false })}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-slate-950 disabled:opacity-50"
        >
          {running ? "Running…" : "Run full system test"}
        </button>
        <button
          type="button"
          disabled={running}
          onClick={() => onRun({ skipScaling: true })}
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 disabled:opacity-50"
        >
          Run without scaling probe
        </button>
      </div>
      {lastError ? (
        <p className="mt-3 rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">{lastError}</p>
      ) : null}
    </section>
  );
}
