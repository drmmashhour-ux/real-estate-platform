import { getFullMarketIntelligence } from "@/modules/ai/market-intelligence";

const GOLD = "var(--color-premium-gold)";

export default async function InvestorMarketPage() {
  const intel = await getFullMarketIntelligence();

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Market intelligence</h1>
          <p className="mt-1 text-xs text-slate-500">Updated {new Date(intel.generatedAt).toLocaleString()}</p>
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Daily summary</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">{intel.dailySummary}</p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Trends</h2>
          <ul className="mt-4 space-y-3">
            {intel.trends.map((t) => (
              <li
                key={t.label + t.detail}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/5 pb-3 last:border-0"
              >
                <span className="font-medium text-white">{t.label}</span>
                <span
                  className="text-xs font-semibold uppercase"
                  style={{
                    color:
                      t.direction === "up" ? "#4ade80" : t.direction === "down" ? "#f87171" : "#94a3b8",
                  }}
                >
                  {t.direction}
                </span>
                <p className="w-full text-sm text-slate-400">{t.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Insights</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-400">
            {intel.insights.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      </div>

      <aside className="space-y-6">
        <section className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-5">
          <h2 className="text-sm font-semibold" style={{ color: GOLD }}>
            News wire
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Sources: {intel.newsSources.length ? `${intel.newsSources.length} feeds` : "defaults"} ·{" "}
            {intel.newsFetchedAt.slice(0, 10)}
          </p>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            {intel.newsHeadlines.slice(0, 8).map((h) => (
              <li key={h} className="border-b border-white/5 pb-2 last:border-0">
                {h}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 p-5 text-xs text-slate-600">
          Configure RSS via <code className="text-slate-400">INVESTOR_NEWS_FEEDS</code> (comma-separated URLs).
        </section>
      </aside>
    </div>
  );
}
