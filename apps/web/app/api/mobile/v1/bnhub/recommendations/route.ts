import { recommendSupabaseListingIdsForUser } from "@/lib/monetization/supabase-recommendations";
import { getMobileAuthUser } from "@/lib/mobile/mobileAuth";

export const dynamic = "force-dynamic";

/**
 * GET — deterministic personalized Supabase listing ids (favorites + recent views).
 */
export async function GET(request: Request) {
  const user = await getMobileAuthUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Math.min(30, Math.max(1, Number(url.searchParams.get("limit")) || 12));

  const listingIds = await recommendSupabaseListingIdsForUser(user.id, limit);

  return Response.json({
    listingIds,
    strategy: "favorites_and_recency",
  });
}
