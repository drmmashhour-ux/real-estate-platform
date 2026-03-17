import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getBrokerNetwork } from "@/lib/property-graph/graph-service";

/**
 * GET /api/property-graph/broker/:brokerId/network
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ brokerId: string }> }
) {
  try {
    await getGuestId();
    const { brokerId } = await context.params;
    const network = await getBrokerNetwork(brokerId);
    return Response.json(network);
  } catch (e) {
    return Response.json({ error: "Failed to load broker network" }, { status: 500 });
  }
}
