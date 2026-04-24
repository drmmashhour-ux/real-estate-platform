import type { DreamHomeMatchedListing } from "@/modules/dream-home/types/dream-home.types";
import { DreamHomeListingCard } from "./DreamHomeListingCard";
import { DreamHomeEmptyState } from "./DreamHomeEmptyState";

type Props = { listings: DreamHomeMatchedListing[]; basePath: string; onRefine?: () => void };

export function DreamHomeTopMatches({ listings, basePath, onRefine }: Props) {
  if (listings.length === 0) {
    return (
      <DreamHomeEmptyState
        onRefine={onRefine}
        message="No public listings matched your filters. Try a wider area, budget, or bedroom count."
      />
    );
  }
  return (
    <ul className="mt-4 space-y-4">
      {listings.slice(0, 6).map((L, i) => (
        <DreamHomeListingCard key={L.id} listing={L} basePath={basePath} rank={i + 1} />
      ))}
    </ul>
  );
}
