import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { isAiOperatorEnabled, callAiOperator } from "@/lib/ai-operator-client";

export const dynamic = "force-dynamic";

/** POST /api/ai-operator/pricing/recommend – Pricing Agent */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!isAiOperatorEnabled()) {
      return Response.json(
        { error: "AI Operator not configured (set AI_OPERATOR_URL)" },
        { status: 503 }
      );
    }
    const output = await callAiOperator<Record<string, unknown>>(
      "/api/ai-operator/pricing/recommend",
      body
    );
    const entityId = (body.listingId ?? "listing") as string;
    await prisma.aiOperatorDecision.create({
      data: {
        agentType: "pricing",
        entityType: "listing",
        entityId,
        inputSummary: body as object,
        outputSummary: output as object,
        confidenceScore: (output.confidenceScore as number) ?? 0,
        recommendedAction: (output.recommendedAction as string) ?? "suggest_price_update",
        reasonCodes: Array.isArray(output.reasonCodes) ? output.reasonCodes : [],
        automatedAction: "suggest_price_update",
      },
    }).catch(() => {});
    return Response.json(output);
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "Pricing recommendation failed" },
      { status: 500 }
    );
  }
}
