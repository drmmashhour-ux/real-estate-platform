import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { isAiOperatorEnabled, callAiOperator } from "@/lib/ai-operator-client";

export const dynamic = "force-dynamic";

/** POST /api/ai-operator/bookings/check – Booking Integrity Agent */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!isAiOperatorEnabled()) {
      return Response.json({ error: "AI Operator not configured (set AI_OPERATOR_URL)" }, { status: 503 });
    }
    const output = await callAiOperator<Record<string, unknown>>("/api/ai-operator/bookings/check", body);
    const entityId = (body.bookingId ?? "unknown") as string;
    await prisma.aiOperatorDecision.create({
      data: {
        agentType: "booking_integrity",
        entityType: "booking",
        entityId,
        inputSummary: body as object,
        outputSummary: output as object,
        confidenceScore: (output.confidenceScore as number) ?? 0,
        recommendedAction: (output.recommendedAction as string) ?? "approve_booking",
        reasonCodes: Array.isArray(output.reasonCodes) ? output.reasonCodes : [],
        automatedAction: (output as { suggestedAction?: string }).suggestedAction !== "approve" ? "flag_booking_for_review" : null,
      },
    }).catch(() => {});
    return Response.json(output);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Booking check failed" }, { status: 500 });
  }
}
