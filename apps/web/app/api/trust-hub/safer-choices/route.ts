import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateSaferChoices } from "@/modules/quebec-trust-hub/saferChoiceEngine";

import { logTrustHubEvent } from "@/modules/quebec-trust-hub/trustHubAuditLogger";

export async function POST(req: Request) {
  try {
    const { draftId } = await req.json();

    // @ts-ignore
    const draft = await prisma.turboDraft.findUnique({
      where: { id: draftId }
    });

    if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

    const input = draft.contextJson as any;
    const result = draft.resultJson as any;

    const choices = generateSaferChoices(input, result);

    if (choices.length > 0) {
      await logTrustHubEvent({
        draftId,
        userId: draft.userId || undefined,
        eventKey: "safer_choice_generated",
        severity: "INFO",
        payload: { issueKeys: choices.map(c => c.issueKey) }
      });
    }

    return NextResponse.json(choices);
  } catch (err) {
    return NextResponse.json({ error: "Failed to generate safer choices" }, { status: 500 });
  }
}
