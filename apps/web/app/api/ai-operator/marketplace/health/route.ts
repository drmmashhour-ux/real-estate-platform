import { NextRequest } from "next/server";
import { prisma } from "@repo/db";
import { isAiOperatorEnabled, callAiOperator } from "@/lib/ai-operator-client";

export const dynamic = "force-dynamic";

/** POST /api/ai-operator/marketplace/health – Marketplace Health Agent */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!isAiOperatorEnabled()) {
      return Response.json({ error: "AI Operator not configured (set AI_OPERATOR_URL)" }, { status: 503 });
    }
    const output = await callAiOperator<Record<string, unknown>>("/api/ai-operator/marketplace/health", body);
    await prisma.aiOperatorDecision.create({
      data: {
        agentType: "marketplace_health",
        entityType: "marketplace",
        entityId: "global",
        inputSummary: body as object,
        outputSummary: output as object,
        confidenceScore: (output.confidenceScore as number) ?? 0,
        recommendedAction: (output.recommendedAction as string) ?? "no_action",
        reasonCodes: Array.isArray(output.reasonCodes) ? output.reasonCodes : [],
        automatedAction: (output as { recommendedAction?: string }).recommendedAction === "create_alert" ? "create_alert" : null,
        createdAt: new Date(),
      },
    }).catch(() => {});
    return Response.json(output);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Marketplace health check failed" }, { status: 500 });
  }
}
