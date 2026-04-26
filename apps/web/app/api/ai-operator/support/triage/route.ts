import { NextRequest } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { isAiOperatorEnabled, callAiOperator } from "@/lib/ai-operator-client";

export const dynamic = "force-dynamic";

/** POST /api/ai-operator/support/triage – Support Triage Agent */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!isAiOperatorEnabled()) {
      return Response.json({ error: "AI Operator not configured (set AI_OPERATOR_URL)" }, { status: 503 });
    }
    const output = await callAiOperator<Record<string, unknown>>("/api/ai-operator/support/triage", body);
    const entityId = (body.ticketId ?? "ticket") as string;
    await prisma.aiOperatorDecision.create({
      data: {
        agentType: "support_triage",
        entityType: "ticket",
        entityId,
        createdAt: new Date(),
        inputSummary: body as object,
        outputSummary: output as object,
        confidenceScore: (output.confidenceScore as number) ?? 0,
        recommendedAction: (output.recommendedAction as string) ?? "route_support_ticket",
        reasonCodes: Array.isArray(output.reasonCodes) ? output.reasonCodes : [],
        automatedAction: "route_support_ticket",
      },
    }).catch(() => {});
    return Response.json(output);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Support triage failed" }, { status: 500 });
  }
}
