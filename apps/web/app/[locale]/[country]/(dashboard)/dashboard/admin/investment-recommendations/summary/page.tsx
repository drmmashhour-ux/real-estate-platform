import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { getPortfolioRecommendationSummary } from "@/modules/investment/portfolio-recommendation.service";

export const dynamic = "force-dynamic";

const GOLD = "var(--color-premium-gold)";

export default async function AdminInvestmentRecommendationSummaryPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=/${locale}/${country}/dashboard/admin/investment-recommendations/summary`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    redirect(`/${locale}/${country}/dashboard`);
  }

  const summary = await getPortfolioRecommendationSummary();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: GOLD }}>
          BNHub · portfolio
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">Recommendation summary</h1>
        <p className="mt-2 max-w-3xl text-sm text-[#B3B3B3]">
          Distribution of latest active deterministic recommendations per listing (deduped). Not investment advice.
        </p>
        <Link
          href={`/${locale}/${country}/dashboard/admin/investment-recommendations`}
          className="mt-4 inline-block text-sm font-medium text-premium-gold hover:underline"
        >
          ← Back to detail view
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <CountCard label="Buy" value={summary.counts.buy} />
        <CountCard label="Sell" value={summary.counts.sell} />
        <CountCard label="Optimize" value={summary.counts.optimize} />
        <CountCard label="Hold" value={summary.counts.hold} />
        <CountCard label="Watch" value={summary.counts.watch} />
      </div>

      <section className="rounded-2xl border border-white/10 bg-black/35 p-5">
        <h2 className="text-sm font-semibold text-white">Strongest buy signals (score)</h2>
        <div className="mt-3 space-y-2">
          {summary.strongestBuys.length === 0 ? (
            <p className="text-sm text-[#737373]">None in the active set.</p>
          ) : (
            summary.strongestBuys.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 py-2 text-sm">
                <span className="font-mono text-[#B3B3B3]">{row.scopeId}</span>
                <span className="text-white">Score: {row.score}</span>
                <span className="text-[#737373]">Confidence: {Math.round(Number(row.confidenceScore) * 100)}%</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/35 p-5">
        <h2 className="text-sm font-semibold text-white">Sell stance (lowest scores)</h2>
        <div className="mt-3 space-y-2">
          {summary.highestRiskSells.length === 0 ? (
            <p className="text-sm text-[#737373]">None in the active set.</p>
          ) : (
            summary.highestRiskSells.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 py-2 text-sm">
                <span className="font-mono text-[#B3B3B3]">{row.scopeId}</span>
                <span className="text-white">Score: {row.score}</span>
                <span className="text-[#737373]">Confidence: {Math.round(Number(row.confidenceScore) * 100)}%</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function CountCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="text-xs uppercase tracking-wide text-[#737373]">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-white">{value}</p>
    </div>
  );
}
