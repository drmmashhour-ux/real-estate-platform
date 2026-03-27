import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { isAiOperatorEnabled, callAiOperator } from "@/lib/ai-operator-client";

export const dynamic = "force-dynamic";

/** POST /api/ai-operator/hosts/analyze – Host Performance Agent */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!isAiOperatorEnabled()) {
      return Response.json({ error: "AI Operator not configured (set AI_OPERATOR_URL)" }, { status: 503 });
    }
    const output = await callAiOperator<Record<string, unknown>>("/api/ai-operator/hosts/analyze", body);
    const hostId = (body.hostId ?? "unknown") as string;
    await prisma.aiOperatorDecision.create({
      data: {
        agentType: "host_performance",
        entityType: "host",
        entityId: hostId,
        inputSummary: body as object,
        outputSummary: output as object,
        confidenceScore: (output.confidenceScore as number) ?? 0,
        recommendedAction: (output.recommendedAction as string) ?? "recommend_host_improvement",
        reasonCodes: Array.isArray(output.reasonCodes) ? output.reasonCodes : [],
        automatedAction: "recommend_host_improvement",
        createdAt: new Date(),
      },
    }).catch(() => {});
    return Response.json(output);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Host analysis failed" }, { status: 500 });
  }
}
