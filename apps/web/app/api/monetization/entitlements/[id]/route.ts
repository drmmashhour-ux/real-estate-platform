import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getEntitlementsForUser } from "@/lib/monetization";

/**
 * GET /api/monetization/entitlements/:id (id = userId)
 * Returns feature entitlements for the user (user must be self or admin).
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUserId = await getGuestId();
    if (!currentUserId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const { id: userId } = await context.params;
    if (currentUserId !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const entitlements = await getEntitlementsForUser(userId);
    return Response.json({ entitlements });
  } catch (e) {
    return Response.json({ error: "Failed to load entitlements" }, { status: 500 });
  }
}
