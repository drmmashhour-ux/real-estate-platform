import { cityToSlug } from "@/lib/market/slug";
import type { RankedDailyDealItem } from "@/src/modules/daily-deal-feed/domain/dailyDealFeed.types";
import { DealQuickActions } from "@/src/modules/daily-deal-feed/ui/DealQuickActions";
import { SaveToWatchlistButton } from "@/src/modules/watchlist-alerts/ui/SaveToWatchlistButton";

export function DailyDealCard({ item }: { item: RankedDailyDealItem }) {
  const analysisHref = `/analysis/${cityToSlug(item.city)}/${item.listingId}`;
  const contactHref = `/sell/${item.listingId}#contact`;

  return (
    <article className="rounded-xl border border-white/10 bg-[#0f0f10] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{item.title}</p>
          <p className="text-xs text-slate-400">
            {item.city} · ${(item.priceCents / 100).toLocaleString("en-CA")}
          </p>
        </div>
        <p className="rounded bg-premium-gold/15 px-2 py-1 text-xs font-semibold text-premium-gold">#{item.rankPosition}</p>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <Metric label="Deal" value={item.dealScore} />
        <Metric label="Trust" value={item.trustScore} />
        <Metric label="Confidence" value={item.confidence} />
      </div>

      <p className="mt-3 text-sm text-slate-200">{item.explanation.headline}</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.explanation.detail}</p>
      <div className="mt-2">
        <SaveToWatchlistButton listingId={item.listingId} />
      </div>

      <DealQuickActions listingId={item.listingId} analyzeHref={analysisHref} contactHref={contactHref} />
    </article>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
