import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getUserNetwork } from "@/lib/property-graph/graph-service";

/**
 * GET /api/property-graph/user/:id/network (id = userId)
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const current = await getGuestId();
    if (!current) return Response.json({ error: "Sign in required" }, { status: 401 });
    const { id: userId } = await context.params;
    const network = await getUserNetwork(userId);
    return Response.json(network);
  } catch (e) {
    return Response.json({ error: "Failed to load user network" }, { status: 500 });
  }
}
