import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { canManageBrokerClient } from "@/modules/crm/services/broker-crm-permissions";
import { requireBrokerOrAdminApi } from "@/modules/crm/services/require-broker-api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; interactionId: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const gate = await requireBrokerOrAdminApi();
  if (!gate.ok) return gate.response;
  const { session } = gate;
  const { id, interactionId } = await ctx.params;

  const client = await prisma.brokerClient.findUnique({ where: { id } });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canManageBrokerClient(session, client)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.brokerClientInteraction.findFirst({
    where: { id: interactionId, brokerClientId: id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  let completedAt: Date | null | undefined = undefined;
  if (body.completedAt != null && body.completedAt !== "") {
    const d = new Date(String(body.completedAt));
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "completedAt is invalid" }, { status: 400 });
    }
    completedAt = d;
  } else if (body.completed === true) {
    completedAt = new Date();
  } else if (body.completed === false) {
    completedAt = null;
  }

  if (completedAt === undefined) {
    return NextResponse.json({ error: "Provide completedAt or completed" }, { status: 400 });
  }

  const interaction = await prisma.brokerClientInteraction.update({
    where: { id: interactionId },
    data: { completedAt },
  });

  if (completedAt !== undefined && completedAt !== null) {
    void trackDemoEvent(DemoEvents.CRM_TASK_COMPLETED, { clientId: id }, session.id);
  }

  return NextResponse.json({ ok: true, interaction });
}
