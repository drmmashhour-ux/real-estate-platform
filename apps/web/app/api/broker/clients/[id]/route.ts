import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { canDeleteBrokerClient, canViewBrokerClient } from "@/modules/crm/services/broker-crm-permissions";
import { getBrokerClientDetailForPage } from "@/modules/crm/services/get-client-detail";
import { requireBrokerOrAdminApi } from "@/modules/crm/services/require-broker-api";
import {
  parseNotes,
  parseOptionalEmail,
  parseOptionalPhone,
  parseRequiredName,
  parseSource,
  parseTags,
  parseTargetCity,
} from "@/modules/crm/services/validation";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  const gate = await requireBrokerOrAdminApi();
  if (!gate.ok) return gate.response;
  const { session } = gate;
  const { id } = await ctx.params;

  const bundle = await getBrokerClientDetailForPage(id, session);
  if (!bundle.ok) {
    if (bundle.reason === "not_found") return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    client: bundle.client,
    related: bundle.related,
  });
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const gate = await requireBrokerOrAdminApi();
  if (!gate.ok) return gate.response;
  const { session } = gate;
  const { id } = await ctx.params;

  const existing = await prisma.brokerClient.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canViewBrokerClient(session, existing)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const data: Prisma.BrokerClientUpdateInput = {};

  if (body.fullName !== undefined) {
    const fullName = parseRequiredName(body.fullName);
    if (!fullName.ok) return NextResponse.json({ error: fullName.error }, { status: 400 });
    data.fullName = fullName.value;
  }
  if (body.email !== undefined) {
    const email = parseOptionalEmail(body.email);
    if (!email.ok) return NextResponse.json({ error: email.error }, { status: 400 });
    data.email = email.value ?? null;
  }
  if (body.phone !== undefined) {
    const phone = parseOptionalPhone(body.phone);
    if (!phone.ok) return NextResponse.json({ error: phone.error }, { status: 400 });
    data.phone = phone.value ?? null;
  }
  if (body.notes !== undefined) {
    const notes = parseNotes(body.notes);
    if (!notes.ok) return NextResponse.json({ error: notes.error }, { status: 400 });
    data.notes = notes.value ?? null;
  }
  if (body.source !== undefined) {
    const source = parseSource(body.source);
    if (!source.ok) return NextResponse.json({ error: source.error }, { status: 400 });
    data.source = source.value ?? null;
  }
  if (body.targetCity !== undefined) {
    const targetCity = parseTargetCity(body.targetCity);
    if (!targetCity.ok) return NextResponse.json({ error: targetCity.error }, { status: 400 });
    data.targetCity = targetCity.value ?? null;
  }
  if (body.tags !== undefined) {
    const tags = parseTags(body.tags);
    if (!tags.ok) return NextResponse.json({ error: tags.error }, { status: 400 });
    data.tags = tags.value;
  }

  if (body.budgetMin !== undefined) {
    if (body.budgetMin === null || body.budgetMin === "") data.budgetMin = null;
    else {
      const n = typeof body.budgetMin === "number" ? body.budgetMin : parseFloat(String(body.budgetMin));
      if (!Number.isFinite(n) || n < 0) return NextResponse.json({ error: "budgetMin is invalid" }, { status: 400 });
      data.budgetMin = n;
    }
  }
  if (body.budgetMax !== undefined) {
    if (body.budgetMax === null || body.budgetMax === "") data.budgetMax = null;
    else {
      const n = typeof body.budgetMax === "number" ? body.budgetMax : parseFloat(String(body.budgetMax));
      if (!Number.isFinite(n) || n < 0) return NextResponse.json({ error: "budgetMax is invalid" }, { status: 400 });
      data.budgetMax = n;
    }
  }

  if (body.userId !== undefined) {
    if (body.userId === null || body.userId === "") {
      data.linkedUser = { disconnect: true };
    } else {
      const uid = typeof body.userId === "string" ? body.userId.trim() : "";
      if (!uid) return NextResponse.json({ error: "userId is invalid" }, { status: 400 });
      const u = await prisma.user.findUnique({ where: { id: uid }, select: { id: true } });
      if (!u) return NextResponse.json({ error: "Linked user not found" }, { status: 400 });
      data.linkedUser = { connect: { id: uid } };
    }
  }

  if (session.role === "ADMIN" && typeof body.brokerId === "string" && body.brokerId.trim()) {
    const bid = body.brokerId.trim();
    const brokerUser = await prisma.user.findUnique({
      where: { id: bid },
      select: { id: true, role: true },
    });
    if (!brokerUser || brokerUser.role !== "BROKER") {
      return NextResponse.json({ error: "brokerId must be a broker user" }, { status: 400 });
    }
    data.broker = { connect: { id: bid } };
  }

  const client = await prisma.brokerClient.update({
    where: { id },
    data,
  });

  void trackDemoEvent(DemoEvents.CRM_CLIENT_UPDATED, { clientId: client.id }, session.id);

  return NextResponse.json({ ok: true, client });
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const gate = await requireBrokerOrAdminApi();
  if (!gate.ok) return gate.response;
  const { session } = gate;
  const { id } = await ctx.params;

  const existing = await prisma.brokerClient.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canDeleteBrokerClient(session, existing)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.brokerClient.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
