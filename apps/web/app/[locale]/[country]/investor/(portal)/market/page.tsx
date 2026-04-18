import { getFullMarketIntelligence } from "@/modules/ai/market-intelligence";

const GOLD = "var(--color-ds-gold)";

export default async function InvestorMarketPage() {
  const intel = await getFullMarketIntelligence();

  return (
    <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
      <div className="space-y-5 sm:space-y-6 lg:col-span-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ds-text">Market intelligence</h1>
          <p className="mt-2 text-xs text-ds-text-secondary">
            Generated {new Date(intel.generatedAt).toLocaleString()} · internal aggregates only (not third-party data)
          </p>
        </div>

        <p
          className="rounded-2xl border border-ds-gold/25 bg-ds-gold/5 px-4 py-3.5 text-xs leading-relaxed text-ds-text-secondary sm:px-5"
          role="note"
        >
          <span className="font-semibold uppercase tracking-wide text-ds-gold">Internal estimates · </span>
          {intel.estimateDisclaimer}
        </p>

        <section className="rounded-2xl border border-ds-border bg-ds-card/80 p-5 sm:p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ds-text-secondary">
            Trailing activity (14 days)
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ds-text/95">{intel.dailySummary}</p>
        </section>

        <section className="rounded-2xl border border-ds-border bg-ds-card/80 p-5 sm:p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ds-text-secondary">
            Directional signals (platform data)
          </h2>
          <ul className="mt-4 space-y-3">
            {intel.trends.map((t, i) => (
              <li
                key={`${t.label}-${i}`}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/5 pb-3 last:border-0"
              >
                <span className="font-medium text-ds-text">{t.label}</span>
                <span
                  className="text-xs font-semibold uppercase"
                  style={{
                    color:
                      t.direction === "up" ? "#4ade80" : t.direction === "down" ? "#f87171" : "#94a3b8",
                  }}
                >
                  {t.direction}
                </span>
                <p className="w-full text-sm text-ds-text-secondary">{t.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-ds-border bg-ds-card/80 p-5 sm:p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ds-text-secondary">
            Inventory &amp; engagement (summary)
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-ds-text-secondary">
            {intel.insights.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      </div>

      <aside className="space-y-6">
        <section className="rounded-2xl border border-ds-gold/25 bg-ds-card/90 p-5">
          <h2 className="text-sm font-semibold" style={{ color: GOLD }}>
            News wire
          </h2>
          <p className="mt-1 text-xs text-ds-text-secondary">
            Third-party headlines only when sourced from your RSS config ·{" "}
            {intel.newsSources.length ? `${intel.newsSources.length} feeds` : "defaults"} · fetched{" "}
            {intel.newsFetchedAt.slice(0, 10)}
          </p>
          <ul className="mt-4 space-y-3 text-sm text-ds-text/95">
            {intel.newsHeadlines.slice(0, 8).map((h, i) => (
              <li key={`${i}-${h.slice(0, 24)}`} className="border-b border-white/5 pb-2 last:border-0">
                {h}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-ds-border bg-ds-surface/80 p-5 text-xs leading-relaxed text-ds-text-secondary">
          Configure RSS via <code className="text-ds-gold/90">INVESTOR_NEWS_FEEDS</code> (comma-separated URLs). Headlines
          are not vetted for accuracy — corroborate before citing externally.
        </section>
      </aside>
    </div>
  );
}
