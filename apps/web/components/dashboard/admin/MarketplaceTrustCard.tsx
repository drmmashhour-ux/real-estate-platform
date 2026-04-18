export function MarketplaceTrustCard(props: { hint?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <p className="text-xs uppercase text-slate-500">Trust indicators</p>
      <p className="mt-1 text-sm text-slate-300">{props.hint ? "Floor signals active (flag)." : "Read-only baseline."}</p>
    </div>
  );
}
