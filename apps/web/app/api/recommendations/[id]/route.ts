import { getSimilarStayRecommendations } from "@/lib/services/recommendation";
import { getGuestId } from "@/lib/auth/session";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";

export const dynamic = "force-dynamic";

/**
 * GET /api/recommendations/:id — “You may also like” for a published BNHub `bnhub_listings.id`.
 * Relevance = similarity (city, type, price band, rating) + demand + optional signed-in user preferences.
 */
export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const ip = getClientIp(_req);
  if (!rateLimit(ip)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }
  const { id } = await context.params;
  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }
  const userId = await getGuestId();
  const result = await getSimilarStayRecommendations(id, userId);
  if (!result.ok) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  return Response.json({
    ok: true,
    listingId: id,
    items: result.items,
    personalized: Boolean(userId),
  });
}
