import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getBrokerIdentity } from "@/lib/identity-network";

/**
 * GET /api/identity-network/broker/:id (id = brokerIdentityId)
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await getGuestId();
    const { id: brokerIdentityId } = await context.params;
    const broker = await getBrokerIdentity(brokerIdentityId);
    if (!broker) return Response.json({ error: "Broker identity not found" }, { status: 404 });
    return Response.json(broker);
  } catch (e) {
    return Response.json({ error: "Failed to load broker identity" }, { status: 500 });
  }
}
