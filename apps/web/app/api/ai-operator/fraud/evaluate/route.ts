import { NextRequest } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { isAiOperatorEnabled, callAiOperator } from "@/lib/ai-operator-client";

export const dynamic = "force-dynamic";

/** POST /api/ai-operator/fraud/evaluate – Fraud Risk Agent */
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
      "/api/ai-operator/fraud/evaluate",
      body
    );
    const entityId = ((body.bookingId ?? body.userId) ?? "unknown") as string;
    const entityType = body.bookingId ? "booking" : "user";
    await prisma.aiOperatorDecision.create({
      data: {
        agentType: "fraud_risk",
        entityType,
        entityId,
        createdAt: new Date(),
        inputSummary: body as object,
        outputSummary: output as object,
        confidenceScore: (output.confidenceScore as number) ?? 0,
        recommendedAction: (output.recommendedAction as string) ?? "allow",
        reasonCodes: Array.isArray(output.reasonCodes) ? output.reasonCodes : [],
        automatedAction: (output as { autoFlag?: boolean }).autoFlag ? "flag_booking_for_review" : null,
      },
    }).catch(() => {});
    if ((output as { autoFlag?: boolean }).autoFlag) {
      await prisma.aiOperatorAlert.create({
        data: {
          alertType: "fraud_risk",
          severity: (output as { riskLevel?: string }).riskLevel === "critical" ? "critical" : "high",
          entityType,
          entityId,
        createdAt: new Date(),
          message: `Fraud risk ${(output as { riskLevel?: string }).riskLevel}; score ${(output as { fraudRiskScore?: number }).fraudRiskScore}`,
          status: "open",
          metadata: output as object,
        },
      }).catch(() => {});
    }
    return Response.json(output);
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "Fraud evaluation failed" },
      { status: 500 }
    );
  }
}
