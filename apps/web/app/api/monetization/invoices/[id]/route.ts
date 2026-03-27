import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getInvoicesForUser } from "@/lib/monetization";

/**
 * GET /api/monetization/invoices/:id (id = userId)
 * Returns invoices for the user (user must be self or admin).
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

    const limit = Number(new URL(_request.url).searchParams.get("limit")) || 24;
    const invoices = await getInvoicesForUser(userId, limit);
    return Response.json({ invoices });
  } catch (e) {
    return Response.json({ error: "Failed to load invoices" }, { status: 500 });
  }
}
