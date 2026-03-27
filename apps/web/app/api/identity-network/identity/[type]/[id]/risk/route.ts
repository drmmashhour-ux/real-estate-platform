import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getIdentityRiskProfile } from "@/lib/identity-network";
import { IDENTITY_TYPES } from "@/lib/identity-network/types";

/**
 * GET /api/identity-network/identity/:type/:id/risk
 * type: OWNER | BROKER | ORGANIZATION
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ type: string; id: string }> }
) {
  try {
    await getGuestId();
    const { type, id } = await context.params;
    if (!IDENTITY_TYPES.includes(type as "OWNER" | "BROKER" | "ORGANIZATION")) {
      return Response.json({ error: "type must be OWNER, BROKER, or ORGANIZATION" }, { status: 400 });
    }
    const risk = await getIdentityRiskProfile(type as "OWNER" | "BROKER" | "ORGANIZATION", id);
    return Response.json(risk ?? { riskProfile: null });
  } catch (e) {
    return Response.json({ error: "Failed to load risk profile" }, { status: 500 });
  }
}
