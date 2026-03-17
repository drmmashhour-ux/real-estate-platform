import { NextRequest } from "next/server";
import { recordPolicyAcceptance } from "@/lib/defense/legal-records";

export const dynamic = "force-dynamic";

/** POST – record policy/terms acceptance (e.g. after user accepts booking terms). */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, policyKey, policyVersion, marketId, entityType, entityId, ipAddress, userAgent } = body;
    if (!userId || !policyKey || !policyVersion) {
      return Response.json(
        { error: "userId, policyKey, policyVersion required" },
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
      ipAddress,
      userAgent,
    });
    return Response.json(record);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to record acceptance" }, { status: 500 });
  }
}
