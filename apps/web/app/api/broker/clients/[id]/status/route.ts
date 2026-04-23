import { NextRequest, NextResponse } from "next/server";
import type { BrokerClientStatus } from "@prisma/client";
import { prisma } from "@repo/db";
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { canManageBrokerClient } from "@/modules/crm/services/broker-crm-permissions";
import { canTransitionBrokerClientStatus } from "@/modules/crm/services/client-status-machine";
import { requireBrokerOrAdminApi } from "@/modules/crm/services/require-broker-api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, ctx: Ctx) {
  const gate = await requireBrokerOrAdminApi();
  if (!gate.ok) return gate.response;
  const { session } = gate;
  const { id } = await ctx.params;

  const client = await prisma.brokerClient.findUnique({ where: { id } });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canManageBrokerClient(session, client)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const nextRaw = typeof body.status === "string" ? body.status.trim() : "";
  const next = nextRaw as BrokerClientStatus;
  const statuses: BrokerClientStatus[] = [
    "LEAD",
    "CONTACTED",
    "QUALIFIED",
    "VIEWING",
    "NEGOTIATING",
    "UNDER_CONTRACT",
    "CLOSED",
    "LOST",
  ];
  if (!nextRaw || !statuses.includes(next)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (!canTransitionBrokerClientStatus(client.status, next, session.role)) {
    return NextResponse.json(
      { error: `Cannot transition from ${client.status} to ${next}` },
      { status: 400 }
    );
  }

  const note =
    body.message === undefined || body.message === null
      ? null
      : String(body.message).trim().slice(0, 20000) || null;

  const fromStatus = client.status;

  const tx = await prisma.$transaction([
    prisma.brokerClient.update({
      where: { id },
      data: { status: next },
    }),
    prisma.brokerClientInteraction.create({
      data: {
        brokerClientId: id,
        actorId: session.id,
        type: "STATUS_CHANGE",
        title: `Status → ${next}`,
        message: note,
        metadata: { fromStatus, toStatus: next } as object,
      },
    }),
  ]);
  const updated = tx[0];

  void trackDemoEvent(
    DemoEvents.CRM_STATUS_CHANGED,
    { clientId: id, fromStatus, toStatus: next },
    session.id
  );

  return NextResponse.json({ ok: true, client: updated });
}
