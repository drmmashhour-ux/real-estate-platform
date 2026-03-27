import { NextRequest } from "next/server";
import { evaluate } from "@/lib/ai";

export const dynamic = "force-dynamic";

/** POST /api/ai/evaluate – evaluate listing, booking, or user. Returns riskScore (0–100) and trustLevel. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entityType, entityId } = body as { entityType?: string; entityId?: string };
    if (!entityType || !entityId) {
      return Response.json(
        { error: "entityType and entityId required (e.g. listing, booking, user)" },
        { status: 400 }
      );
    }
    const allowed = ["listing", "booking", "user"];
    if (!allowed.includes(entityType)) {
      return Response.json(
        { error: `entityType must be one of: ${allowed.join(", ")}` },
        { status: 400 }
      );
    }
    const result = await evaluate({
      entityType: entityType as "listing" | "booking" | "user",
      entityId,
      log: true,
    });
    return Response.json({
      riskScore: result.riskScore,
      trustLevel: result.trustLevel,
      factors: result.factors,
      entityType: result.entityType,
      entityId: result.entityId,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Evaluate failed";
    if (msg.includes("not found")) {
      return Response.json({ error: msg }, { status: 404 });
    }
    console.error(e);
    return Response.json({ error: "Failed to evaluate" }, { status: 500 });
  }
}

/** GET /api/ai/evaluate?entityType=listing&entityId=... */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");
  if (!entityType || !entityId) {
    return Response.json(
      { error: "query params entityType and entityId required" },
      { status: 400 }
    );
  }
  return POST(
    new NextRequest(request.url, {
      method: "POST",
      body: JSON.stringify({ entityType, entityId }),
    })
  );
}
