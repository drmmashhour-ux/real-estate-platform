import { marketplaceIntelligenceFlags } from "@/config/feature-flags";
import { getMarketplaceIntelligenceDashboardPayload } from "@/modules/marketplace-intelligence/marketplace-intelligence-dashboard.service";

function priorityColor(p: string) {
  if (p === "HIGH") return "text-amber-300";
  if (p === "MEDIUM") return "text-sky-300";
  return "text-zinc-400";
}

export async function MarketplaceIntelligenceSection() {
  if (!marketplaceIntelligenceFlags.marketplaceIntelligenceV1) {
    return null;
  }

  const data = await getMarketplaceIntelligenceDashboardPayload();

  return (
    <section className="rounded-2xl border border-cyan-900/35 bg-cyan-950/15 p-5 sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400/90">Marketplace intelligence V6</p>
          <h2 className="mt-1 text-lg font-bold tracking-tight">Quality · trust · fraud · pricing (advisory)</h2>
        </div>
        <p className="max-w-lg text-xs text-zinc-500">
          Recommendation-first signals — no auto-bans, no live price changes, no global search reorder from this panel.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800/80 bg-black/25 p-4">
          <h3 className="text-sm font-semibold text-zinc-100">Latest quality snapshot</h3>
          {data.sampleQuality ? (
            <dl className="mt-3 space-y-1 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-500">Listing</dt>
                <dd className="font-mono text-zinc-200">{data.sampleQuality.listingId}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-500">Score</dt>
                <dd className="text-zinc-200">{data.sampleQuality.score.toFixed(1)} / 100</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-500">Confidence</dt>
                <dd className="text-zinc-200">{data.sampleQuality.confidence.toFixed(2)}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-2 text-xs text-zinc-500">No quality snapshots yet — run the orchestrator on a listing.</p>
          )}
          {!marketplaceIntelligenceFlags.marketplaceTrustScoringV1 ? (
            <p className="mt-2 text-xs text-amber-200/90">Trust persistence disabled (`FEATURE_MARKETPLACE_TRUST_SCORING_V1`).</p>
          ) : null}
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-black/25 p-4">
          <h3 className="text-sm font-semibold text-zinc-100">Latest trust snapshot</h3>
          {data.sampleTrust ? (
            <dl className="mt-3 space-y-1 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-500">Listing</dt>
                <dd className="font-mono text-zinc-200">{data.sampleTrust.listingId}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-500">Score</dt>
                <dd className="text-zinc-200">{data.sampleTrust.score.toFixed(1)} / 100</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-500">Confidence</dt>
                <dd className="text-zinc-200">{data.sampleTrust.confidence.toFixed(2)}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-2 text-xs text-zinc-500">No trust snapshots yet.</p>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800/80 bg-black/25 p-4">
          <h3 className="text-sm font-semibold text-zinc-100">Open fraud review items</h3>
          {marketplaceIntelligenceFlags.marketplaceFraudReviewV1 ? (
            data.openFraud.length ? (
              <ul className="mt-3 space-y-2 text-xs">
                {data.openFraud.slice(0, 6).map((f) => (
                  <li key={f.id} className="rounded-lg border border-zinc-800/60 bg-zinc-950/40 p-2">
                    <div className="flex justify-between gap-2">
                      <span className="font-medium text-zinc-200">{f.signalType}</span>
                      <span className="text-zinc-500">{f.severity}</span>
                    </div>
                    <p className="mt-1 text-zinc-400 line-clamp-2">{f.reason}</p>
                    <p className="mt-1 text-[10px] text-zinc-600">
                      conf {f.confidence.toFixed(2)}
                      {f.listingId ? ` · listing ${f.listingId}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-zinc-500">Queue empty.</p>
            )
          ) : (
            <p className="mt-2 text-xs text-zinc-500">Fraud review disabled by flag.</p>
          )}
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-black/25 p-4">
          <h3 className="text-sm font-semibold text-zinc-100">Pending pricing recommendations</h3>
          {marketplaceIntelligenceFlags.marketplacePricingIntelligenceV1 ? (
            data.pendingPricing.length ? (
              <ul className="mt-3 space-y-2 text-xs">
                {data.pendingPricing.slice(0, 6).map((p) => (
                  <li key={p.id} className="rounded-lg border border-zinc-800/60 bg-zinc-950/40 p-2">
                    <div className="flex justify-between gap-2">
                      <span className="font-mono text-zinc-200">{p.listingId}</span>
                      <span className="text-cyan-200/90">
                        {(p.adjustmentPercent * 100).toFixed(1)}% suggested
                      </span>
                    </div>
                    <p className="mt-1 text-zinc-400 line-clamp-3">{p.reason}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-zinc-500">No pending rows.</p>
            )
          ) : (
            <p className="mt-2 text-xs text-zinc-500">Pricing intelligence disabled by flag.</p>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800/80 bg-black/25 p-4">
          <h3 className="text-sm font-semibold text-zinc-100">Boost candidates (advisory)</h3>
          {marketplaceIntelligenceFlags.marketplaceRankingSignalsV1 ? (
            data.boostCandidates.length ? (
              <ul className="mt-2 space-y-2 text-xs text-zinc-300">
                {data.boostCandidates.map((b, i) => (
                  <li key={`${b.listingId}-${i}`} className="border-b border-zinc-800/50 pb-2 last:border-0">
                    <span className="font-mono text-cyan-200/90">{b.listingId ?? "—"}</span>
                    <p className="text-zinc-500 line-clamp-2">{b.reason}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-zinc-500">None in recent decision log.</p>
            )
          ) : (
            <p className="mt-2 text-xs text-zinc-500">Ranking signals flag off — not evaluating boost metadata.</p>
          )}
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-black/25 p-4">
          <h3 className="text-sm font-semibold text-zinc-100">Downrank candidates (advisory)</h3>
          {marketplaceIntelligenceFlags.marketplaceRankingSignalsV1 ? (
            data.downrankCandidates.length ? (
              <ul className="mt-2 space-y-2 text-xs text-zinc-300">
                {data.downrankCandidates.map((b, i) => (
                  <li key={`${b.listingId}-d-${i}`} className="border-b border-zinc-800/50 pb-2 last:border-0">
                    <span className="font-mono text-amber-200/90">{b.listingId ?? "—"}</span>
                    <p className="text-zinc-500 line-clamp-2">{b.reason}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-zinc-500">None in recent decision log.</p>
            )
          ) : (
            <p className="mt-2 text-xs text-zinc-500">Ranking signals flag off.</p>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-800/80 bg-black/25 p-4">
        <h3 className="text-sm font-semibold text-zinc-100">Recent decision log</h3>
        {data.recentDecisions.length ? (
          <ul className="mt-3 space-y-2 text-xs">
            {data.recentDecisions.slice(0, 12).map((d) => (
              <li key={d.id} className="flex flex-col gap-0.5 rounded-lg border border-zinc-800/50 bg-zinc-950/30 p-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <span className="font-medium text-zinc-200">{d.decisionType}</span>
                  {d.listingId ? (
                    <span className="ml-2 font-mono text-[10px] text-zinc-500">{d.listingId}</span>
                  ) : null}
                  <p className="mt-1 text-zinc-500 line-clamp-2">{d.reason}</p>
                </div>
                <span className={`shrink-0 text-[10px] uppercase ${priorityColor(d.priority)}`}>{d.priority}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-zinc-500">No decisions logged yet.</p>
        )}
        <details className="mt-4 text-xs text-zinc-500">
          <summary className="cursor-pointer text-zinc-400">About evidence payloads</summary>
          <p className="mt-2">
            Raw evidence stays in Postgres for audit. Primary surface shows human-readable reasons only — expand admin tools
            if you need JSON exports.
          </p>
        </details>
      </div>
    </section>
  );
}
