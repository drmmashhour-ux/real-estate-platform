import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateComplianceScore } from "@/modules/quebec-trust-hub/complianceScore";
import { requireUser } from "@/lib/auth/require-user";

import { logTrustHubEvent } from "@/modules/quebec-trust-hub/trustHubAuditLogger";

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const { draftId } = await req.json();

    // @ts-ignore
    const draft = await prisma.turboDraft.findUnique({
      where: { id: draftId }
    });

    if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

    const input = draft.contextJson as any;
    const result = draft.resultJson as any;

    const scoreResult = calculateComplianceScore(input, result);

    // Save score
    // @ts-ignore
    await prisma.trustHubScore.create({
      data: {
        draftId,
        userId: auth.user.id,
        score: scoreResult.score,
        status: scoreResult.status,
        resultJson: scoreResult as any
      }
    });

    await logTrustHubEvent({
      draftId,
      userId: auth.user.id,
      eventKey: "trust_score_calculated",
      severity: scoreResult.score >= 70 ? "SUCCESS" : "WARNING",
      payload: { score: scoreResult.score, status: scoreResult.status }
    });

    return NextResponse.json(scoreResult);
  } catch (err) {
    return NextResponse.json({ error: "Failed to calculate score" }, { status: 500 });
  }
}
