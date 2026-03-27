import { recordPlatformEvent } from "@/lib/observability";
import { isTrustGraphEnabled } from "@/lib/trustgraph/config";
import { isTrustGraphRankingBoostEnabled } from "@/lib/trustgraph/feature-flags";
import type { FsboRankingRow, ListingAugmentationPublic } from "@/lib/trustgraph/infrastructure/services/listingRankingBoostService";
import {
  augmentRowsWithTrustRanking,
  loadLatestListingCasesForIds,
} from "@/lib/trustgraph/infrastructure/services/listingRankingBoostService";

export async function applyListingRankingBoostIfEnabled<T extends FsboRankingRow>(
  rows: T[]
): Promise<{ rows: T[]; publicAugmentations: Map<string, ListingAugmentationPublic> | null }> {
  if (!isTrustGraphEnabled() || !isTrustGraphRankingBoostEnabled() || rows.length === 0) {
    return { rows, publicAugmentations: null };
  }

  const cases = await loadLatestListingCasesForIds(rows.map((r) => r.id));
  const { sorted, augmentations } = augmentRowsWithTrustRanking(rows, cases);

  void recordPlatformEvent({
    eventType: "trustgraph_ranking_boost_applied",
    sourceModule: "trustgraph",
    entityType: "FSBO_SEARCH",
    entityId: "batch",
    payload: {
      listingCount: rows.length,
      caseHits: cases.size,
    },
  }).catch(() => {});

  return { rows: sorted, publicAugmentations: augmentations };
}
