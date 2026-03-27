import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getPropertyValuations } from "@/lib/property-graph/graph-service";

/**
 * GET /api/property-graph/property/:id/valuations (id = propertyIdentityId)
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await getGuestId();
    const { id: propertyIdentityId } = await context.params;
    const valuations = await getPropertyValuations(propertyIdentityId);
    return Response.json({ valuations });
  } catch (e) {
    return Response.json({ error: "Failed to load valuations" }, { status: 500 });
  }
}
