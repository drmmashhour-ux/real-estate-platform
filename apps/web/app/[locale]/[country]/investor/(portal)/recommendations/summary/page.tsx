import Link from "next/link";
import { requireInvestorUser } from "@/lib/auth/require-investor";
import { loadBnhubInvestorRecommendationsView } from "@/modules/investment/investor-recommendations-view.service";

export const dynamic = "force-dynamic";

const GOLD = "var(--color-premium-gold)";

export default async function InvestorRecommendationSummaryPage() {
  const { email } = await requireInvestorUser();
  const data = await loadBnhubInvestorRecommendationsView(email);

  if (!data.ok) {
    return (
      <div className="rounded-2xl border border-amber-900/40 bg-amber-950/20 p-8 text-slate-300">
        <h1 className="text-lg font-semibold text-white">Portfolio recommendation summary</h1>
        <p className="mt-2 text-sm text-slate-400">
          Investor access is required to view aggregated stance counts for your BNHub listings.
        </p>
      </div>
    );
  }

  const { summary } = data;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
          Portfolio view
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Recommendation distribution</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Counts reflect the latest active deterministic label per stay in <strong className="text-slate-300">your</strong>{" "}
          linked inventory. Not investment advice — operational signals only.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <CountCard label="Buy" value={summary.counts.buy} accent />
        <CountCard label="Sell" value={summary.counts.sell} />
        <CountCard label="Optimize" value={summary.counts.optimize} />
        <CountCard label="Hold" value={summary.counts.hold} />
        <CountCard label="Watch" value={summary.counts.watch} />
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold text-white">Strongest buy signals (by score)</h2>
        <p className="mt-1 text-xs text-slate-500">Highest-scoring stays currently labeled buy within your scope.</p>
        <div className="mt-4 space-y-2">
          {summary.strongestBuys.length === 0 ? (
            <p className="text-sm text-slate-500">None in this portfolio slice.</p>
          ) : (
            summary.strongestBuys.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 py-2 text-sm">
                <span className="font-mono text-xs text-slate-400">{row.scopeId}</span>
                <span className="tabular-nums text-slate-300">Score {row.score}</span>
                <span className="tabular-nums text-slate-500">
                  {Math.round(Number(row.confidenceScore) * 100)}% conf.
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold text-white">Sell / exit stress (lowest scores)</h2>
        <p className="mt-1 text-xs text-slate-500">Stays labeled sell — review operations before any capital decision.</p>
        <div className="mt-4 space-y-2">
          {summary.highestRiskSells.length === 0 ? (
            <p className="text-sm text-slate-500">None labeled sell right now.</p>
          ) : (
            summary.highestRiskSells.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 py-2 text-sm">
                <span className="font-mono text-xs text-slate-400">{row.scopeId}</span>
                <span className="tabular-nums text-slate-300">Score {row.score}</span>
                <span className="tabular-nums text-slate-500">
                  {Math.round(Number(row.confidenceScore) * 100)}% conf.
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      <p className="text-center text-sm">
        <Link href="/investor/recommendations" className="text-premium-gold hover:underline">
          Back to full list
        </Link>
      </p>
    </div>
  );
}

function CountCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div
      className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center"
      style={accent ? { borderColor: "rgba(212,175,55,0.35)" } : undefined}
    >
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-white">{value}</p>
    </div>
  );
}
