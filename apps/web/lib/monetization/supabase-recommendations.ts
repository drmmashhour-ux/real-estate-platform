import { prisma } from "@/lib/db";

/**
 * Personalized listing ids (Supabase) from favorites + recent views (deterministic, no external LLM).
 */
export async function recommendSupabaseListingIdsForUser(userId: string, limit = 16): Promise<string[]> {
  const uid = userId.trim();
  if (!uid) return [];

  const [favs, views] = await Promise.all([
    prisma.bnhubSupabaseGuestFavorite.findMany({
      where: { guestUserId: uid },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: { supabaseListingId: true },
    }),
    prisma.bnhubClientListingViewEvent.findMany({
      where: { userId: uid },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: { supabaseListingId: true },
    }),
  ]);

  const out: string[] = [];
  const seen = new Set<string>();
  for (const f of favs) {
    if (!seen.has(f.supabaseListingId)) {
      seen.add(f.supabaseListingId);
      out.push(f.supabaseListingId);
    }
  }
  for (const v of views) {
    if (!seen.has(v.supabaseListingId)) {
      seen.add(v.supabaseListingId);
      out.push(v.supabaseListingId);
    }
  }
  return out.slice(0, Math.max(1, Math.min(50, limit)));
}
