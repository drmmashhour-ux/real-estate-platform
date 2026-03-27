import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getPropertyGraph, getPropertyRelations, getPropertyFraudSignals, getPropertyHistory } from "@/lib/property-graph/graph-service";

/**
 * GET /api/admin/property-graph/investigation/:id (id = propertyIdentityId)
 * Combined view for fraud/safety investigation: graph, relations, fraud signals, history.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const { id: propertyIdentityId } = await context.params;

    const [graph, relations, fraudSignals, history] = await Promise.all([
      getPropertyGraph(propertyIdentityId),
      getPropertyRelations(propertyIdentityId),
      getPropertyFraudSignals(propertyIdentityId),
      getPropertyHistory(propertyIdentityId),
    ]);

    if (!relations?.property) return Response.json({ error: "Property not found" }, { status: 404 });

    return Response.json({
      graph,
      relations,
      fraudSignals,
      history,
    });
  } catch (e) {
    return Response.json({ error: "Investigation load failed" }, { status: 500 });
  }
}
