export function MarketplaceRankingCard(props: { rankingEnabled: boolean }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <p className="text-xs uppercase text-slate-500">Ranking</p>
      <p className="mt-1 text-sm text-slate-300">
        {props.rankingEnabled ? "Ranking flags detected — bounded exposure rules apply." : "Ranking flags off for this tenant."}
      </p>
    </div>
  );
}
