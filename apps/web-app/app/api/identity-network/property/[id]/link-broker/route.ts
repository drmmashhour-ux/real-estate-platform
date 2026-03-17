import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { linkPropertyBroker } from "@/lib/identity-network";

/**
 * POST /api/identity-network/property/:id/link-broker
 * Body: { brokerIdentityId, authorizationSource, ownerIdentityId?, verificationStatus? }
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await getGuestId();
    const { id: propertyIdentityId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const { brokerIdentityId, authorizationSource, ownerIdentityId, verificationStatus } = body;
    if (!brokerIdentityId || typeof brokerIdentityId !== "string") {
      return Response.json({ error: "brokerIdentityId required" }, { status: 400 });
    }
    if (!authorizationSource || typeof authorizationSource !== "string") {
      return Response.json({ error: "authorizationSource required" }, { status: 400 });
    }
    const record = await linkPropertyBroker(propertyIdentityId, brokerIdentityId, {
      authorizationSource,
      ownerIdentityId: ownerIdentityId ?? null,
      verificationStatus: verificationStatus ?? undefined,
    });
    return Response.json(record);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to link broker";
    return Response.json({ error: message }, { status: 400 });
  }
}
