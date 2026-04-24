import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getActionPipelineForBroker } from "@/modules/action-pipeline/action-pipeline.service";
import { SIGNATURE_CONTROL_NAMESPACE } from "@/lib/signature-control/autopilot-broker-ack";

export const dynamic = "force-dynamic";

/**
 * GET — [signature-control] audit events for one action pipeline (broker assignee or admin).
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const visible = await getActionPipelineForBroker(id, userId, user.role === PlatformRole.ADMIN);
  if (!visible) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows = await prisma.signatureControlAuditLog.findMany({
    where: {
      actionPipelineId: id,
      eventKey: { startsWith: SIGNATURE_CONTROL_NAMESPACE },
    },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: { id: true, eventKey: true, payload: true, actorUserId: true, createdAt: true },
  });

  return NextResponse.json({
    items: rows.map((r) => ({
      id: r.id,
      eventKey: r.eventKey,
      payload: r.payload,
      actorUserId: r.actorUserId,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
