import { NextRequest } from "next/server";
import { getFraudScore, evaluateAndStoreFraudScore } from "@/lib/ai-fraud";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    if (!entityType || !entityId) {
      return Response.json({ error: "entityType, entityId required" }, { status: 400 });
    }
    const score = await getFraudScore(entityType, entityId);
    return Response.json(score ?? { score: null, message: "No score yet" });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to get fraud score" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entityType, entityId, signalIds, logDecision } = body;
    if (!entityType || !entityId) {
      return Response.json({ error: "entityType, entityId required" }, { status: 400 });
    }
    const result = await evaluateAndStoreFraudScore({
      entityType,
      entityId,
      signalIds,
      logDecision: !!logDecision,
    });
    return Response.json(result);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to evaluate fraud score" }, { status: 500 });
  }
}
