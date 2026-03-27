import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getPropertyRelations } from "@/lib/property-graph/graph-service";

/**
 * GET /api/property-graph/property/:id/relations (id = propertyIdentityId)
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await getGuestId();
    const { id: propertyIdentityId } = await context.params;
    const relations = await getPropertyRelations(propertyIdentityId);
    if (!relations.property) return Response.json({ error: "Property not found" }, { status: 404 });
    return Response.json(relations);
  } catch (e) {
    return Response.json({ error: "Failed to load relations" }, { status: 500 });
  }
}
