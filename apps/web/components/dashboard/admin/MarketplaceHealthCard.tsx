export function MarketplaceHealthCard(props: { level: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <p className="text-xs uppercase text-slate-500">Health</p>
      <p className="mt-1 font-medium capitalize text-slate-200">{props.level}</p>
    </div>
  );
}
