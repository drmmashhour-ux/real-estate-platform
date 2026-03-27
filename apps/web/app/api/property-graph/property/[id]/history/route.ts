import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getPropertyHistory } from "@/lib/property-graph/graph-service";

/**
 * GET /api/property-graph/property/:id/history (id = propertyIdentityId)
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await getGuestId();
    const { id: propertyIdentityId } = await context.params;
    const history = await getPropertyHistory(propertyIdentityId);
    return Response.json({ history });
  } catch (e) {
    return Response.json({ error: "Failed to load history" }, { status: 500 });
  }
}
