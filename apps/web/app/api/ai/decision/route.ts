import { NextRequest } from "next/server";
import { getRecommendedAction } from "@/lib/ai/decision";

export const dynamic = "force-dynamic";

/** POST /api/ai/decision – run AI decision for a queue item and return recommended action. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { queueItemId } = body as { queueItemId?: string };
    if (!queueItemId) {
      return Response.json({ error: "queueItemId required" }, { status: 400 });
    }
    const result = await getRecommendedAction(queueItemId);
    if (!result) {
      return Response.json({ error: "Queue item not found" }, { status: 404 });
    }
    return Response.json({
      recommendedAction: result.recommendedAction,
      riskScore: result.riskScore,
      trustScore: result.trustScore,
      trustLevel: result.trustLevel,
      factors: result.factors,
      fraudAction: result.fraudAction,
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Decision failed" }, { status: 500 });
  }
}
