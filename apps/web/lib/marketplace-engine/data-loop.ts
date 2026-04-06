import { refreshBnhubListingDemandScore } from "@/lib/monetization/demand-score";
import { prisma } from "@/lib/db";
import { logInfo, logWarn } from "@/lib/logger";

const DEFAULT_LISTING_BATCH = 120;

/**
 * Batch-refresh demand scores for listings with recent engagement (retention + pricing loop).
 */
export async function runBnhubMarketplaceDataLoop(params?: { listingBatchSize?: number }): Promise<{
  refreshedListingIds: number;
  distinctListings: number;
}> {
  const take = Math.min(500, Math.max(20, params?.listingBatchSize ?? DEFAULT_LISTING_BATCH));
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const rows = await prisma.bnhubClientListingViewEvent.findMany({
    where: { createdAt: { gte: since } },
    select: { supabaseListingId: true },
    orderBy: { createdAt: "desc" },
    take: 3000,
  });

  const seen = new Set<string>();
  const ids: string[] = [];
  for (const r of rows) {
    if (!r.supabaseListingId || seen.has(r.supabaseListingId)) continue;
    seen.add(r.supabaseListingId);
    ids.push(r.supabaseListingId);
    if (ids.length >= take) break;
  }
  let ok = 0;
  for (const id of ids) {
    try {
      await refreshBnhubListingDemandScore(id);
      ok += 1;
    } catch (e) {
      logWarn("[marketplace-loop] demand refresh failed", { listingId: id, message: String(e) });
    }
  }

  logInfo("[marketplace-loop] completed", { distinctListings: ids.length, refreshed: ok });
  return { refreshedListingIds: ok, distinctListings: ids.length };
}
