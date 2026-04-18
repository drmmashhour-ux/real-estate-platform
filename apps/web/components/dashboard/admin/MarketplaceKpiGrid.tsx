export function MarketplaceKpiGrid(props: { kpis: Array<{ label: string; value: string }> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {props.kpis.map((k) => (
        <div key={k.label} className="rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3">
          <p className="text-xs text-slate-500">{k.label}</p>
          <p className="mt-1 font-mono text-lg text-slate-200">{k.value}</p>
        </div>
      ))}
    </div>
  );
}
