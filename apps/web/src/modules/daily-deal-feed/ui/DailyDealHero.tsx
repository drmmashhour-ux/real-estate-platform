import { cityToSlug } from "@/lib/market/slug";
import type { RankedDailyDealItem } from "@/src/modules/daily-deal-feed/domain/dailyDealFeed.types";

export function DailyDealHero({ item }: { item: RankedDailyDealItem | null }) {
  if (!item) return null;
  const href = `/analysis/${cityToSlug(item.city)}/${item.listingId}`;
  return (
    <section className="rounded-2xl border border-premium-gold/40 bg-gradient-to-br from-[#1a1408] to-[#0f0f10] p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-premium-gold">Deal of the day</p>
      <h2 className="mt-2 text-xl font-semibold text-white">{item.title}</h2>
      <p className="mt-1 text-sm text-slate-300">{item.city} · score {item.score}</p>
      <p className="mt-2 text-sm text-slate-200">{item.explanation.detail}</p>
      <a href={href} className="mt-4 inline-flex rounded-lg bg-premium-gold px-4 py-2 text-sm font-semibold text-black hover:bg-premium-gold">
        Open full analysis
      </a>
    </section>
  );
}
