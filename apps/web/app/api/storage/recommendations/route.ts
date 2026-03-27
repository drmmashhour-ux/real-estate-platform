import { getGuestId } from "@/lib/auth/session";
import { getOptimizationRecommendations } from "@/lib/storage/ai-optimizer";

export const dynamic = "force-dynamic";

/**
 * GET /api/storage/recommendations
 * Returns AI optimization recommendations for the current user.
 */
export async function GET() {
  try {
    const userId = await getGuestId();
    const recommendations = await getOptimizationRecommendations(userId ?? undefined);
    return Response.json({ recommendations });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to load recommendations" }, { status: 500 });
  }
}
