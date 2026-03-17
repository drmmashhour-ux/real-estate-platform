import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getPropertyGraph, getPropertyRelations } from "@/lib/property-graph/graph-service";

/**
 * GET /api/admin/property-graph/property/:propertyIdentityId
 * Full graph + relations for admin / investigation.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ propertyIdentityId: string }> }
) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const { propertyIdentityId } = await context.params;
    const include = request.nextUrl.searchParams.get("include") ?? "graph,relations";
    const parts = include.split(",").map((s) => s.trim());

    const [graph, relations] = await Promise.all([
      parts.includes("graph") ? getPropertyGraph(propertyIdentityId) : null,
      parts.includes("relations") ? getPropertyRelations(propertyIdentityId) : null,
    ]);

    if (!graph && !relations) return Response.json({ error: "Property not found" }, { status: 404 });
    if (!relations?.property) return Response.json({ graph, relations: null });
    return Response.json({ graph, relations });
  } catch (e) {
    return Response.json({ error: "Failed to load property graph" }, { status: 500 });
  }
}
