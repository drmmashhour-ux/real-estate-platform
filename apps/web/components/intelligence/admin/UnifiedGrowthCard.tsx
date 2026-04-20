export function UnifiedGrowthCard(props: { growth?: Record<string, unknown>; ranking?: Record<string, unknown> }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Growth &amp; ranking</p>
      <p className="mt-2 text-xs text-slate-600">Advisory slices — deterministic services only; no ML scores.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-[10px] font-semibold uppercase text-slate-600">Growth</p>
          <pre className="mt-2 max-h-48 overflow-auto text-[11px] text-slate-400">
            {props.growth && Object.keys(props.growth).length > 0
              ? JSON.stringify(props.growth, null, 2)
              : "{}"}
          </pre>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase text-slate-600">Ranking</p>
          <pre className="mt-2 max-h-48 overflow-auto text-[11px] text-slate-400">
            {props.ranking && Object.keys(props.ranking).length > 0
              ? JSON.stringify(props.ranking, null, 2)
              : "{}"}
          </pre>
        </div>
      </div>
    </div>
  );
}
