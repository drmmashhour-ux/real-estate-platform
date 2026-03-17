import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { isAiOperatorEnabled, callAiOperator } from "@/lib/ai-operator-client";

export const dynamic = "force-dynamic";

/** POST /api/ai-operator/listings/analyze – Listing Moderation Agent */
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
      "/api/ai-operator/listings/analyze",
      body
    );
    const entityId = (body.listingId ?? "unknown") as string;
    await prisma.aiOperatorDecision.create({
      data: {
        agentType: "listing_moderation",
        entityType: "listing",
        entityId,
        inputSummary: body as object,
        outputSummary: output as object,
        confidenceScore: (output.confidenceScore as number) ?? 0,
        recommendedAction: (output.recommendedAction as string) ?? "manual_review",
        reasonCodes: Array.isArray(output.reasonCodes) ? output.reasonCodes : [],
        automatedAction: (output as { automatedAction?: string }).automatedAction ?? null,
      },
    }).catch(() => {});
    return Response.json(output);
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "Listing analysis failed" },
      { status: 500 }
    );
  }
}
