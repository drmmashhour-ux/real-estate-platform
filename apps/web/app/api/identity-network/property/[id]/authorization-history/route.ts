import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getPropertyAuthorizationHistory } from "@/lib/identity-network";

/**
 * GET /api/identity-network/property/:id/authorization-history
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await getGuestId();
    const { id } = await context.params;
    const history = await getPropertyAuthorizationHistory(id);
    return Response.json({ authorizationHistory: history });
  } catch (e) {
    return Response.json({ error: "Failed to load authorization history" }, { status: 500 });
  }
}
