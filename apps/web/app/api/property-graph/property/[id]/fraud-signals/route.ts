import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getPropertyFraudSignals } from "@/lib/property-graph/graph-service";

/**
 * GET /api/property-graph/property/:id/fraud-signals (id = propertyIdentityId)
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await getGuestId();
    const { id: propertyIdentityId } = await context.params;
    const signals = await getPropertyFraudSignals(propertyIdentityId);
    return Response.json(signals);
  } catch (e) {
    return Response.json({ error: "Failed to load fraud signals" }, { status: 500 });
  }
}
