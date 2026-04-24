import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getProtectionModeStatus } from "@/modules/quebec-trust-hub/protectionMode";

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

    const status = getProtectionModeStatus(input, result);

    if (status.enabled) {
      await logTrustHubEvent({
        draftId,
        userId: draft.userId || undefined,
        eventKey: "protection_mode_enabled",
        severity: "WARNING",
        payload: { reasons: status.reasonsFr }
      });
    }

    return NextResponse.json(status);
  } catch (err) {
    return NextResponse.json({ error: "Failed to get protection mode status" }, { status: 500 });
  }
}
