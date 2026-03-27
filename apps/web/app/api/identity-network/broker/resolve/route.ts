import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { resolveBroker } from "@/lib/identity-network";

/**
 * POST /api/identity-network/broker/resolve
 * Body: { legalName, licenseNumber, brokerageName?, existingBrokerIdentityId? }
 */
export async function POST(request: NextRequest) {
  try {
    await getGuestId();
    const body = await request.json().catch(() => ({}));
    const { legalName, licenseNumber, brokerageName, existingBrokerIdentityId } = body;
    if (!legalName || typeof legalName !== "string") {
      return Response.json({ error: "legalName required" }, { status: 400 });
    }
    if (!licenseNumber || typeof licenseNumber !== "string") {
      return Response.json({ error: "licenseNumber required" }, { status: 400 });
    }
    const result = await resolveBroker({
      legalName,
      licenseNumber,
      brokerageName: brokerageName ?? null,
      existingBrokerIdentityId: existingBrokerIdentityId ?? null,
    });
    return Response.json(result);
  } catch (e) {
    return Response.json({ error: "Resolution failed" }, { status: 500 });
  }
}
