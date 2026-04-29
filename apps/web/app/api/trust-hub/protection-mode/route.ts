import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getProtectionModeStatus } from "../../../../modules/quebec-trust-hub/protectionMode";
import { logTrustHubEvent } from "../../../../modules/quebec-trust-hub/trustHubAuditLogger";

export async function POST(req: NextRequest) {
  try {
    const { draftId } = await req.json();
    if (!draftId) return NextResponse.json({ error: "Missing draftId" }, { status: 400 });

    const draft = await prisma.turboDraft.findUnique({
      where: { id: draftId },
    });

    if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

    const status = getProtectionModeStatus({
      ...(draft.contextJson as any),
      resultJson: draft.resultJson,
    });

    if (status.enabled) {
      await logTrustHubEvent({
        draftId,
        userId: draft.userId || undefined,
        eventKey: "protection_mode_enabled",
        payload: { reasons: status.reasons },
      });
    }

    return NextResponse.json(status);
  } catch (error: any) {
    console.error("[PROTECTION_MODE]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
