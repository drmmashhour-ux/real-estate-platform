import Link from "next/link";
import { engineFlags } from "@/config/feature-flags";
import {
  MARKETPLACE_RANKING_WEIGHTS_BASELINE,
  MARKETPLACE_RANKING_WEIGHTS_TEST_TRUST,
  getMarketplaceRankingWeights,
} from "@/lib/marketplace-ranking/ranking-weights";

export const dynamic = "force-dynamic";

export default function MarketplaceRankingDashboardPage() {
  const active = engineFlags.listingMarketplaceRankAlgorithmV1;
  const { weights, presetKey } = getMarketplaceRankingWeights(process.env.RANKING_ALGO_COHORT);

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-8 text-slate-200">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]/90">Internal</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Marketplace ranking</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          Weighted, explainable ordering for BNHub search. Promoted placements and penalties are surfaced in each listing&apos;s
          breakdown — no hidden favoritism. Toggle via{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-amber-200/90">FEATURE_LISTING_MARKETPLACE_RANK_ALGO_V1</code>
          . Cohort experiments use{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-amber-200/90">RANKING_ALGO_COHORT</code>{" "}
          (<span className="text-slate-300">baseline</span>, <span className="text-slate-300">test_trust</span>).
        </p>
      </div>

      <section className="rounded-2xl border border-white/10 bg-black/40 p-6">
        <h2 className="text-lg font-medium text-white">Status</h2>
        <p className="mt-2 text-sm text-slate-300">
          Algorithm flag:{" "}
          <span className={active ? "text-emerald-300" : "text-amber-200"}>{active ? "ON" : "OFF"}</span>
        </p>
        <p className="mt-1 text-sm text-slate-400">
          Active weight preset: <span className="text-slate-200">{presetKey}</span>
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/40 p-6">
        <h2 className="text-lg font-medium text-white">Active weights (normalized)</h2>
        <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          {(Object.entries(weights) as [string, number][]).map(([k, v]) => (
            <li key={k} className="flex justify-between border-b border-white/5 py-2 text-slate-300">
              <span>{k}</span>
              <span className="text-slate-400">{(v * 100).toFixed(1)}%</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/40 p-6">
        <h2 className="text-lg font-medium text-white">Reference presets (code)</h2>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-slate-500">Baseline</p>
            <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-black/60 p-3 text-xs text-slate-400">
              {JSON.stringify(MARKETPLACE_RANKING_WEIGHTS_BASELINE, null, 2)}
            </pre>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">test_trust</p>
            <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-black/60 p-3 text-xs text-slate-400">
              {JSON.stringify(MARKETPLACE_RANKING_WEIGHTS_TEST_TRUST, null, 2)}
            </pre>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/40 p-6">
        <h2 className="text-lg font-medium text-white">APIs</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-slate-400">
          <li>
            <code className="text-slate-300">POST /api/listings/rank</code> — batch rank (broker/admin)
          </li>
          <li>
            <code className="text-slate-300">GET /api/listings/[id]/rank-explain</code> — single listing breakdown
          </li>
        </ul>
        <p className="mt-4 text-sm text-slate-500">
          Search integration: <code className="text-slate-400">GET /api/bnhub/search</code> uses the algorithm when the flag is
          on; price/newest sorts preserve SQL order while still attaching scores.
        </p>
      </section>

      <Link href="/dashboard/memory" className="text-sm text-[#D4AF37]/90 hover:underline">
        Marketplace memory (personalization)
      </Link>
    </div>
  );
}
