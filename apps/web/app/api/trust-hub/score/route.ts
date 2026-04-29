import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateComplianceScore } from "../../../../modules/quebec-trust-hub/complianceScore";
import { logTrustHubEvent } from "../../../../modules/quebec-trust-hub/trustHubAuditLogger";

export async function POST(req: NextRequest) {
  try {
    const { draftId } = await req.json();
    if (!draftId) return NextResponse.json({ error: "Missing draftId" }, { status: 400 });

    const draft = await prisma.turboDraft.findUnique({
      where: { id: draftId },
    });

    if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

    const acks = await prisma.turboDraftAcknowledgement.findMany({
      where: { draftId },
    });

    const context = {
      ...(draft.contextJson as any),
      resultJson: draft.resultJson,
      acknowledgements: acks,
    };

    const result = calculateComplianceScore(context);

    // Persist score
    await prisma.trustHubScore.create({
      data: {
        draftId,
        userId: draft.userId,
        score: result.score,
        status: result.status,
        resultJson: result as any,
      },
    });

    await logTrustHubEvent({
      draftId,
      userId: draft.userId || undefined,
      eventKey: "trust_score_calculated",
      payload: { score: result.score, status: result.status },
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[TRUST_HUB_SCORE]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
