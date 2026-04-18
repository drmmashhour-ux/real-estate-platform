export function MarketplaceGrowthCard(props: { enabled: boolean }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <p className="text-xs uppercase text-slate-500">Growth machine</p>
      <p className="mt-1 text-sm text-slate-300">{props.enabled ? "Modules enabled via flags." : "Disabled — advisory only elsewhere."}</p>
    </div>
  );
}
