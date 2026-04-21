import type { RankingBadgeId } from "@/modules/listing-ranking/ranking.algorithm";
import { BADGE_LABEL } from "@/modules/listing-ranking/ranking.algorithm";

export function ListingRankingBadges({ badges }: { badges: RankingBadgeId[] }) {
  if (!badges.length) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-2" aria-label="Listing ranking highlights">
      {badges.map((id) => (
        <li
          key={id}
          className="rounded-full border border-emerald-500/25 bg-emerald-950/40 px-3 py-1 text-xs font-medium text-emerald-100/95"
        >
          {BADGE_LABEL[id]}
        </li>
      ))}
    </ul>
  );
}
