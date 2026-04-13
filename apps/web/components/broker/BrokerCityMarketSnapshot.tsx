import Link from "next/link";
import { CITY_SLUGS, getCityPageConfig } from "@/lib/geo/city-search";
import { getCityInsights } from "@/lib/city-insights";

/**
 * Compact market snapshot for broker dashboard (server component).
 */
export async function BrokerCityMarketSnapshot() {
  const rows = await Promise.all(
    CITY_SLUGS.map(async (slug) => {
      const [ins, cfg] = await Promise.all([getCityInsights(slug), Promise.resolve(getCityPageConfig(slug))]);
      return { slug, label: cfg.heroTitle.replace(/^Explore\s+/i, ""), score: ins.investmentScore, bn: ins.activeBnhubCount, fs: ins.activeFsboCount };
    })
  );

  return (
    <section
      className="rounded-2xl border border-emerald-500/20 bg-slate-900/40 p-5"
      aria-labelledby="broker-city-snapshot-heading"
    >
      <h2 id="broker-city-snapshot-heading" className="text-sm font-semibold text-emerald-400">
        Market snapshot — key cities
      </h2>
      <p className="mt-1 text-xs text-slate-500">Investment score & listing counts (indicative).</p>
      <ul className="mt-4 space-y-3">
        {rows.map((r) => (
          <li key={r.slug} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-xs">
            <Link href={`/city/${r.slug}`} className="font-medium text-white hover:text-emerald-300">
              {r.label}
            </Link>
            <span className="text-slate-400">
              Score <span className="font-semibold text-premium-gold">{r.score}</span>
              <span className="mx-1.5 text-slate-600">·</span>
              {r.bn} BNHUB · {r.fs} FSBO
            </span>
          </li>
        ))}
      </ul>
      <Link href="/city/montreal" className="mt-3 inline-block text-xs font-medium text-emerald-400 hover:text-emerald-300">
        Open city pages →
      </Link>
    </section>
  );
}
