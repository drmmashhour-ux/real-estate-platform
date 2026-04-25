import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { generateSaferChoices } from "../../../../modules/quebec-trust-hub/saferChoiceEngine";
import { logTrustHubEvent } from "../../../../modules/quebec-trust-hub/trustHubAuditLogger";

export async function POST(req: NextRequest) {
  try {
    const { draftId } = await req.json();
    if (!draftId) return NextResponse.json({ error: "Missing draftId" }, { status: 400 });

    const draft = await prisma.turboDraft.findUnique({
      where: { id: draftId },
    });

    if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

    const choices = generateSaferChoices({
      ...(draft.contextJson as any),
      resultJson: draft.resultJson,
    });

    await logTrustHubEvent({
      draftId,
      userId: draft.userId || undefined,
      eventKey: "safer_choice_generated",
      payload: { count: choices.length },
    });

    return NextResponse.json(choices);
  } catch (error: any) {
    console.error("[SAFER_CHOICES]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
