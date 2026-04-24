import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { logAutopilotEvent } from "@/modules/ai-autopilot-layer/autopilotAuditLogger";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { userId } = await requireAuthenticatedUser();
  const body = (await req.json()) as { actionId?: string };
  if (!body.actionId) return NextResponse.json({ error: "actionId required" }, { status: 400 });

  const row = await prisma.aiAutopilotLayerAction.findFirst({
    where: { id: body.actionId, userId },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.aiAutopilotLayerAction.update({
    where: { id: row.id },
    data: { status: "REJECTED", rejectedAt: new Date() },
  });

  await logAutopilotEvent({
    userId,
    actionId: row.id,
    eventKey: "autopilot_action_rejected",
    payload: { actionKey: row.actionKey },
  });

  return NextResponse.json({ action: updated });
}
