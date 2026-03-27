import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { recordPolicyAcceptance } from "@/lib/defense/legal-records";

export const dynamic = "force-dynamic";

/** POST – record policy/terms acceptance for the current user (e.g. booking_terms before checkout). */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }
    const body = await request.json();
    const { policyKey, policyVersion, marketId, entityType, entityId } = body;
    if (!policyKey || !policyVersion) {
      return Response.json(
        { error: "policyKey, policyVersion required" },
        { status: 400 }
      );
    }
    const record = await recordPolicyAcceptance({
      userId,
      policyKey,
      policyVersion,
      marketId,
      entityType,
      entityId,
    });
    return Response.json(record);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to record acceptance" }, { status: 500 });
  }
}
