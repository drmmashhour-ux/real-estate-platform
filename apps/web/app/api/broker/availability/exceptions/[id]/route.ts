import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireBrokerOrAdminApi } from "@/modules/crm/services/require-broker-api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const gate = await requireBrokerOrAdminApi();
  if (!gate.ok) return gate.response;
  const { session } = gate;
  const { id } = await ctx.params;

  const row = await prisma.availabilityException.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.role !== "ADMIN" && row.brokerId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  if (body.startsAt !== undefined) data.startsAt = new Date(String(body.startsAt));
  if (body.endsAt !== undefined) data.endsAt = new Date(String(body.endsAt));
  if (body.reason !== undefined) data.reason = typeof body.reason === "string" ? body.reason : null;
  if (body.isAvailable !== undefined) data.isAvailable = Boolean(body.isAvailable);

  const exception = await prisma.availabilityException.update({ where: { id }, data });
  if (exception.endsAt <= exception.startsAt) {
    return NextResponse.json({ error: "endsAt must be after startsAt" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, exception });
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const gate = await requireBrokerOrAdminApi();
  if (!gate.ok) return gate.response;
  const { session } = gate;
  const { id } = await ctx.params;

  const row = await prisma.availabilityException.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.role !== "ADMIN" && row.brokerId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.availabilityException.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
