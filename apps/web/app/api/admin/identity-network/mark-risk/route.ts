import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { adminMarkIdentityRisk } from "@/lib/identity-network";
import { IDENTITY_TYPES, RISK_LEVELS } from "@/lib/identity-network/types";

/**
 * POST /api/admin/identity-network/mark-risk
 * Body: { identityType, identityId, riskScore, riskLevel, riskReasons?, investigationStatus? }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { identityType, identityId, riskScore, riskLevel, riskReasons, investigationStatus } = body;

    if (!IDENTITY_TYPES.includes(identityType)) {
      return Response.json({ error: "identityType must be OWNER, BROKER, or ORGANIZATION" }, { status: 400 });
    }
    if (!identityId || typeof identityId !== "string") {
      return Response.json({ error: "identityId required" }, { status: 400 });
    }
    if (typeof riskScore !== "number" || riskScore < 0 || riskScore > 100) {
      return Response.json({ error: "riskScore must be 0-100" }, { status: 400 });
    }
    if (!RISK_LEVELS.includes(riskLevel)) {
      return Response.json({ error: "riskLevel must be low, medium, high, or critical" }, { status: 400 });
    }

    const profile = await adminMarkIdentityRisk(
      identityType,
      identityId,
      { riskScore, riskLevel, riskReasons, investigationStatus },
      userId
    );
    return Response.json(profile);
  } catch (e) {
    return Response.json({ error: "Failed to mark risk" }, { status: 500 });
  }
}
