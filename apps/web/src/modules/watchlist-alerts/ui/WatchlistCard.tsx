import { cityToSlug } from "@/lib/market/slug";
import { SaveToWatchlistButton } from "@/src/modules/watchlist-alerts/ui/SaveToWatchlistButton";
import { RecommendationBadge } from "@/src/modules/watchlist-alerts/ui/RecommendationBadge";
import { ScoreMiniPill } from "@/src/modules/watchlist-alerts/ui/ScoreMiniPill";
import { SeverityBadge } from "@/src/modules/watchlist-alerts/ui/SeverityBadge";

export function WatchlistCard({ item }: { item: any }) {
  const href = `/analysis/${cityToSlug(item.listing.city)}/${item.listingId}`;
  const image = item.listing.images?.[0] ?? null;
  const latest = item.latestAlert;
  const recommendation: string | null = item.listing.recommendation ?? null;

  return (
    <article className="overflow-hidden rounded-xl border border-white/10 bg-[#0f0f10]">
      <div className="h-36 w-full bg-black/30">
        {image ? (
          <img src={image} alt={item.listing.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-500">No image</div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-white line-clamp-1">{item.listing.title}</p>
            <p className="text-xs text-slate-400">
              {item.listing.city} · ${(item.listing.priceCents / 100).toLocaleString("en-CA")}
            </p>
          </div>
          <RecommendationBadge recommendation={recommendation} />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <ScoreMiniPill label="Trust" value={item.listing.trustScore} />
          <ScoreMiniPill label="Deal" value={item.listing.dealScore} />
          <ScoreMiniPill label="Conf" value={item.listing.confidence} />
        </div>

        <div className="mt-3 rounded-lg border border-white/10 bg-black/25 p-2">
          {latest ? (
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-[#C9A646]">Latest alert</p>
                <SeverityBadge severity={latest.severity} />
              </div>
              <p className="mt-1 text-xs text-slate-200">{latest.title}</p>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Monitoring for updates</p>
          )}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <a href={href} className="rounded border border-white/20 px-3 py-1.5 text-center text-xs text-white hover:bg-white/5">Open</a>
          <a href={href} className="rounded border border-white/20 px-3 py-1.5 text-center text-xs text-white hover:bg-white/5">Analyze</a>
          <SaveToWatchlistButton listingId={item.listingId} initiallySaved />
        </div>
      </div>
    </article>
  );
}
