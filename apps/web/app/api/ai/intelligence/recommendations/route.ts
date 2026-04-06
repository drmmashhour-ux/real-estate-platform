import { getUnifiedRecommendations } from "@/lib/ai/recommendations/getUnifiedRecommendations";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** GET — unified recommendations (shared intelligence layer). */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const recommendations = await getUnifiedRecommendations(userId, 12);
    return Response.json({ recommendations });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Recommendations failed" }, { status: 500 });
  }
}
