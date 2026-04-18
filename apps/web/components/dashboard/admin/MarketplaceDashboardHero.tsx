export function MarketplaceDashboardHero(props: { title: string; subtitle: string; freshness: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950 p-6">
      <p className="text-xs uppercase tracking-widest text-slate-500">Marketplace intelligence</p>
      <h1 className="mt-1 text-2xl font-semibold text-slate-100">{props.title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-400">{props.subtitle}</p>
      <p className="mt-3 text-xs text-slate-600">Snapshot freshness: {props.freshness}</p>
    </div>
  );
}
