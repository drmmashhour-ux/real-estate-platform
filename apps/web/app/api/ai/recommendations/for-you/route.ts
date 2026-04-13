import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getRecommendationsForUser } from "@/lib/ai/user-property-recommendations";
import { getUserPreferenceHints } from "@/lib/ai/user-preference-hints";

export const dynamic = "force-dynamic";

/** GET /api/ai/recommendations/for-you — signed-in users; BNHUB-style listings. */
export async function GET(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

  const limit = Math.min(20, Math.max(1, Number(new URL(request.url).searchParams.get("limit")) || 8));
  const [recs, preferenceHints] = await Promise.all([
    getRecommendationsForUser(userId, limit),
    getUserPreferenceHints(userId),
  ]);

  return Response.json({
    recommendations: recs,
    preferenceHints,
    disclaimer: "Recommendations use recent views and inventory rules — not personalized ML.",
  });
}
