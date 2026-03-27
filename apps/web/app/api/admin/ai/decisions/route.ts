import { NextRequest } from "next/server";
import { getAiDecisionLogs, overrideAiDecision } from "@/lib/ai-decision-log";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await getAiDecisionLogs({
      modelKey: searchParams.get("modelKey") ?? undefined,
      entityType: searchParams.get("entityType") ?? undefined,
      entityId: searchParams.get("entityId") ?? undefined,
      decision: searchParams.get("decision") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50,
      offset: searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : 0,
    });
    return Response.json(result);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to get decision logs" }, { status: 500 });
  }
}
