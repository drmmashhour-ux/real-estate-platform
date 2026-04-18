export function ControlledExecutionSummaryCard(props: {
  proposed: number;
  executed: number;
  dryRun: number;
  blocked: number;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-300">
      <p className="text-xs uppercase tracking-wide text-slate-500">Run snapshot</p>
      <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div>
          <dt className="text-slate-500">Proposed</dt>
          <dd className="font-mono text-slate-200">{props.proposed}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Executed</dt>
          <dd className="font-mono text-slate-200">{props.executed}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Dry-run</dt>
          <dd className="font-mono text-slate-200">{props.dryRun}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Policy blocked</dt>
          <dd className="font-mono text-slate-200">{props.blocked}</dd>
        </div>
      </dl>
    </div>
  );
}
