import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getPropertyGraph } from "@/lib/property-graph/graph-service";

/**
 * GET /api/property-graph/property/:propertyIdentityId
 * Full graph view for a property (nodes + edges). Role-based access in production.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ propertyIdentityId: string }> }
) {
  try {
    await getGuestId();
    const { propertyIdentityId } = await context.params;
    const graph = await getPropertyGraph(propertyIdentityId);
    if (!graph) return Response.json({ error: "Property not found" }, { status: 404 });
    return Response.json(graph);
  } catch (e) {
    return Response.json({ error: "Failed to load property graph" }, { status: 500 });
  }
}
