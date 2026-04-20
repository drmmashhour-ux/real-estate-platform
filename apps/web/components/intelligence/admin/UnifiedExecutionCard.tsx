export function UnifiedExecutionCard(props: {
  execution?: Record<string, unknown>;
  governance?: Record<string, unknown>;
}) {
  const hasExec = props.execution && Object.keys(props.execution).length > 0;
  const hasGov = props.governance && Object.keys(props.governance).length > 0;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Execution &amp; governance</p>
      <p className="mt-2 text-xs text-slate-600">
        Canonical autonomy runs only — preview paths never execute writes; outcomes reflect gate disposition on stored rows.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-[10px] font-semibold uppercase text-slate-600">Execution</p>
          {hasExec ? (
            <pre className="mt-2 max-h-56 overflow-auto text-[11px] text-slate-400">
              {JSON.stringify(props.execution, null, 2)}
            </pre>
          ) : (
            <p className="mt-2 text-xs text-slate-600">No run data.</p>
          )}
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase text-slate-600">Governance hints</p>
          {hasGov ? (
            <pre className="mt-2 max-h-56 overflow-auto text-[11px] text-slate-400">
              {JSON.stringify(props.governance, null, 2)}
            </pre>
          ) : (
            <p className="mt-2 text-xs text-slate-600">No governance snapshots.</p>
          )}
        </div>
      </div>
    </div>
  );
}
