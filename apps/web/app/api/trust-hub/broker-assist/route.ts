import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { generateBrokerAssistReason } from "../../../../modules/quebec-trust-hub/brokerAssistRouter";
import { logTrustHubEvent } from "../../../../modules/quebec-trust-hub/trustHubAuditLogger";

export async function POST(req: NextRequest) {
  try {
    const { draftId, action } = await req.json();
    if (!draftId) return NextResponse.json({ error: "Missing draftId" }, { status: 400 });

    const draft = await prisma.turboDraft.findUnique({
      where: { id: draftId },
    });

    if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

    if (action === "REQUEST") {
      const reasonFr = generateBrokerAssistReason({
        ...(draft.contextJson as any),
        resultJson: draft.resultJson,
      });

      const request = await prisma.brokerAssistRequest.create({
        data: {
          draftId,
          userId: draft.userId,
          reasonFr,
          riskJson: draft.resultJson as any,
          status: "REQUESTED",
        },
      });

      await logTrustHubEvent({
        draftId,
        userId: draft.userId || undefined,
        eventKey: "broker_assist_requested",
        payload: { requestId: request.id },
      });

      return NextResponse.json(request);
    }

    // Default: return current request if exists
    const existing = await prisma.brokerAssistRequest.findFirst({
      where: { draftId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(existing || { status: "NONE" });
  } catch (error: any) {
    console.error("[BROKER_ASSIST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
