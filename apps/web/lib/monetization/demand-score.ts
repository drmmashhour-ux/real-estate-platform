import { prisma } from "@/lib/db";

const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Recompute a simple demand score from recent listing views (7d window).
 */
export async function refreshBnhubListingDemandScore(supabaseListingId: string): Promise<void> {
  const id = supabaseListingId.trim();
  if (!id) return;

  const since = new Date(Date.now() - WINDOW_MS);
  const viewCount = await prisma.bnhubClientListingViewEvent.count({
    where: { supabaseListingId: id, createdAt: { gte: since } },
  });
  const favCount = await prisma.bnhubSupabaseGuestFavorite.count({
    where: { supabaseListingId: id, createdAt: { gte: since } },
  });

  const score = Math.min(100, Math.max(5, Math.round(28 + viewCount * 3 + favCount * 8)));
  const factorsJson = {
    windowDays: 7,
    viewCount,
    favCount,
    computedAt: new Date().toISOString(),
  };

  await prisma.bnhubListingDemandScore.upsert({
    where: { supabaseListingId: id },
    create: { supabaseListingId: id, score, factorsJson },
    update: { score, factorsJson },
  });
}
