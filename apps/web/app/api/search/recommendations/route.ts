import { getGuestId } from "@/lib/auth/session";
import { getPersonalizedRecommendations } from "@/lib/ai/search/getPersonalizedRecommendations";

export const dynamic = "force-dynamic";

/**
 * GET — personalized BNHub recommendations for the current session user.
 */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const recommendations = await getPersonalizedRecommendations(userId, 12);
    return Response.json({ recommendations });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Recommendations failed" }, { status: 500 });
  }
}
