import type { InvestorSharedDashboard } from "@/modules/investors/investor-share.types";

type Props = {
  dashboard: InvestorSharedDashboard;
};

export function InvestorSharedDashboardPanel({ dashboard }: Props) {
  const n = dashboard.narrative;

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-center text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
        Read-only investor summary
      </p>
      <header className="mt-3 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
          {dashboard.publicTitle}
        </h1>
        {dashboard.publicSubtitle ? (
          <p className="mt-2 text-sm text-zinc-400">{dashboard.publicSubtitle}</p>
        ) : null}
        <p className="mt-3 text-xs text-zinc-500">
          Snapshot generated {new Date(dashboard.generatedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} ·
          correlational signals only, not audited financials
        </p>
      </header>

      {dashboard.warnings.length ? (
        <div
          className="mt-8 rounded-xl border border-amber-900/40 bg-amber-950/20 px-4 py-3 text-sm text-amber-100/90"
          role="status"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-200/90">Confidence &amp; data limits</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-amber-50/95">
            {dashboard.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {dashboard.metrics.length ? (
        <section className="mt-10">
          <h2 className="text-sm font-semibold text-zinc-200">Key metrics</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {dashboard.metrics.map((m) => (
              <div key={m.label} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{m.label}</p>
                <p className="mt-2 text-xl font-semibold text-zinc-50">{m.value}</p>
                {m.change ? <p className="mt-1 text-xs text-zinc-400">{m.change}</p> : null}
                <p className="mt-3 text-[10px] text-zinc-600">
                  {m.period} · confidence: <span className="text-indigo-300/90">{m.confidence}</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {(n.headline || n.summary || n.growthStory.length > 0) && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold text-zinc-200">Narrative</h2>
          {n.headline ? <p className="mt-3 text-lg font-medium text-zinc-100">{n.headline}</p> : null}
          {n.summary ? <p className="mt-2 text-sm leading-relaxed text-zinc-400">{n.summary}</p> : null}
          {n.growthStory.length ? (
            <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-zinc-400">
              {n.growthStory.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
        </section>
      )}

      {(n.executionProof.length > 0 || n.expansionStory.length > 0) && (
        <section className="mt-10 grid gap-8 md:grid-cols-2">
          {n.executionProof.length > 0 ? (
            <div>
              <h2 className="text-sm font-semibold text-emerald-200/85">Proof points</h2>
              <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-zinc-400">
                {n.executionProof.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {n.expansionStory.length > 0 ? (
            <div>
              <h2 className="text-sm font-semibold text-sky-200/85">Expansion</h2>
              <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-zinc-400">
                {n.expansionStory.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      )}

      {n.risks.length > 0 ? (
        <section className="mt-10 rounded-xl border border-rose-900/35 bg-rose-950/15 p-4">
          <h2 className="text-sm font-semibold text-rose-200/90">Risks</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-rose-50/90">
            {n.risks.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {n.outlook.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-sm font-semibold text-zinc-200">Outlook</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-zinc-400">
            {n.outlook.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-12 border-t border-zinc-800 pt-6 text-center text-[11px] leading-relaxed text-zinc-600">
        This page is view-only and may reflect a snapshot in time. It is not an offer or personalized investment advice.
      </p>
    </article>
  );
}
