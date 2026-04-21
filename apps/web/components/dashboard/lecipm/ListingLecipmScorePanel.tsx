import type { ListingScoreResult } from "@/modules/listing-ranking/listing-score.engine";
import { ListingRankingBadges } from "@/components/listings/ListingRankingBadges";

export function ListingLecipmScorePanel({
  score,
  rankBoost,
  suggestions,
  badges,
}: ListingScoreResult) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#121212] p-5">
      <h2 className="text-lg font-semibold text-white">Listing performance score</h2>
      <p className="mt-1 text-xs text-slate-500">
        Connects engagement, completeness, pricing signals, and green profile — used for visibility hints (not a
        valuation).
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Score</p>
          <p className="text-4xl font-bold text-premium-gold">{score}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Rank boost</p>
          <p className="text-2xl font-semibold text-slate-100">+{rankBoost}</p>
        </div>
      </div>
      <ListingRankingBadges badges={badges} />
      {suggestions.length > 0 ? (
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-300">
          {suggestions.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
