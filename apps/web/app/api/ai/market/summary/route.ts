import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { computeHotZones, trendingAreasByRecentListings } from "@/lib/ai/market-analytics";

export const dynamic = "force-dynamic";

/** GET /api/ai/market/summary — signed-in users; aggregate stats only. */
export async function GET(_request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

  const [hotZones, trending] = await Promise.all([computeHotZones(10), trendingAreasByRecentListings(14, 8)]);

  return Response.json({
    hotZones,
    trendingAreas: trending,
    disclaimer: "Aggregated from published listings — not a forecast.",
  });
}
