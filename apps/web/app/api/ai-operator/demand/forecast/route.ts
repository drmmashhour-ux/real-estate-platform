import { NextRequest } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { isAiOperatorEnabled, callAiOperator } from "@/lib/ai-operator-client";

export const dynamic = "force-dynamic";

/** POST /api/ai-operator/demand/forecast – Demand Forecast Agent */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!isAiOperatorEnabled()) {
      return Response.json({ error: "AI Operator not configured (set AI_OPERATOR_URL)" }, { status: 503 });
    }
    const output = await callAiOperator<Record<string, unknown>>("/api/ai-operator/demand/forecast", body);
    const market = (body.market ?? "global") as string;
    await prisma.aiOperatorDecision.create({
      data: {
        agentType: "demand_forecast",
        entityType: "market",
        entityId: market,
        createdAt: new Date(),
        inputSummary: body as object,
        outputSummary: output as object,
        confidenceScore: (output.confidenceScore as number) ?? 0,
        recommendedAction: (output.recommendedAction as string) ?? "set_demand_forecast",
        reasonCodes: Array.isArray(output.reasonCodes) ? output.reasonCodes : [],
        automatedAction: "set_demand_forecast",
      },
    }).catch(() => {});
    return Response.json(output);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Demand forecast failed" }, { status: 500 });
  }
}
