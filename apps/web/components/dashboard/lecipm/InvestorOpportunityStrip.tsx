type Column = {
  title: string;
  body: string;
  href?: string;
};

type Props = {
  opportunities: Column[];
  watchlist: Column[];
  risk: Column[];
  bnhub: Column[];
};

/**
 * Four-column investor surface — parents pass copy from portfolio APIs.
 */
export function InvestorOpportunityStrip({ opportunities, watchlist, risk, bnhub }: Props) {
  const col = (title: string, items: Column[]) => (
    <div className="rounded-2xl border border-white/10 bg-[#121212] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-premium-gold">{title}</p>
      <ul className="mt-3 space-y-3 text-sm text-slate-300">
        {items.map((c, i) => (
          <li key={i}>
            <p className="font-medium text-white">{c.title}</p>
            <p className="mt-0.5 text-xs text-slate-500">{c.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
      {col("Top opportunities", opportunities)}
      {col("Watchlist changes", watchlist)}
      {col("Risk increases", risk)}
      {col("BNHUB candidates", bnhub)}
    </div>
  );
}
