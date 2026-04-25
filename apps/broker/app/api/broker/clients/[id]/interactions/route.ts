import { NextRequest, NextResponse } from "next/server";
import type { BrokerInteractionType } from "@prisma/client";
import { prisma } from "@repo/db";
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { canManageBrokerClient } from "@/modules/crm/services/broker-crm-permissions";
import { requireBrokerOrAdminApi } from "@/modules/crm/services/require-broker-api";

export const dynamic = "force-dynamic";

const ALLOWED: BrokerInteractionType[] = ["NOTE", "EMAIL", "CALL", "MEETING", "TASK", "FOLLOW_UP"];

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  const gate = await requireBrokerOrAdminApi();
  if (!gate.ok) return gate.response;
  const { session } = gate;
  const { id } = await ctx.params;

  const client = await prisma.brokerClient.findUnique({ where: { id } });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canManageBrokerClient(session, client)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const interactions = await prisma.brokerClientInteraction.findMany({
    where: { brokerClientId: id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ ok: true, interactions });
}

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
  const type = typeof body.type === "string" ? (body.type.trim().toUpperCase() as BrokerInteractionType) : null;
  if (!type || !ALLOWED.includes(type)) {
    return NextResponse.json(
      { error: `type must be one of: ${ALLOWED.join(", ")}` },
      { status: 400 }
    );
  }

  const title =
    body.title === undefined || body.title === null
      ? null
      : String(body.title).trim().slice(0, 200) || null;
  const message =
    body.message === undefined || body.message === null
      ? null
      : String(body.message).trim().slice(0, 20000) || null;

  let dueAt: Date | null = null;
  if (body.dueAt != null && body.dueAt !== "") {
    const d = new Date(String(body.dueAt));
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "dueAt is invalid" }, { status: 400 });
    }
    dueAt = d;
    if (type !== "TASK" && type !== "FOLLOW_UP") {
      return NextResponse.json({ error: "dueAt is only valid for TASK or FOLLOW_UP" }, { status: 400 });
    }
  }

  let completedAt: Date | null = null;
  if (body.completedAt != null && body.completedAt !== "") {
    const d = new Date(String(body.completedAt));
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "completedAt is invalid" }, { status: 400 });
    }
    completedAt = d;
  }

  let metadata: object | undefined;
  if (body.metadata !== undefined && body.metadata !== null && typeof body.metadata === "object") {
    metadata = body.metadata as object;
  }

  const interaction = await prisma.brokerClientInteraction.create({
    data: {
      brokerClientId: id,
      actorId: session.id,
      type,
      title,
      message,
      metadata,
      dueAt,
      completedAt,
    },
  });

  void trackDemoEvent(
    DemoEvents.CRM_INTERACTION_ADDED,
    { clientId: id, interactionType: type },
    session.id
  );

  return NextResponse.json({ ok: true, interaction });
}
