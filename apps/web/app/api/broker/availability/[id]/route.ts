import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBrokerOrAdminApi } from "@/modules/crm/services/require-broker-api";
import { normalizeDayOfWeek, normalizeMinuteRange } from "@/modules/scheduling/services/validate-availability";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const gate = await requireBrokerOrAdminApi();
  if (!gate.ok) return gate.response;
  const { session } = gate;
  const { id } = await ctx.params;

  const row = await prisma.availabilityRule.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.role !== "ADMIN" && row.brokerId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  if (body.dayOfWeek !== undefined) {
    const dow = typeof body.dayOfWeek === "number" ? body.dayOfWeek : parseInt(String(body.dayOfWeek), 10);
    const d = normalizeDayOfWeek(dow);
    if (!d.ok) return NextResponse.json({ error: d.error }, { status: 400 });
    data.dayOfWeek = d.value;
  }
  if (body.startMinute !== undefined && body.endMinute !== undefined) {
    const sm =
      typeof body.startMinute === "number" ? body.startMinute : parseInt(String(body.startMinute), 10);
    const em = typeof body.endMinute === "number" ? body.endMinute : parseInt(String(body.endMinute), 10);
    const mr = normalizeMinuteRange(sm, em);
    if (!mr.ok) return NextResponse.json({ error: mr.error }, { status: 400 });
    data.startMinute = mr.startMinute;
    data.endMinute = mr.endMinute;
  }
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
  if (body.timezone !== undefined) data.timezone = typeof body.timezone === "string" ? body.timezone || null : null;

  const rule = await prisma.availabilityRule.update({ where: { id }, data });
  return NextResponse.json({ ok: true, rule });
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const gate = await requireBrokerOrAdminApi();
  if (!gate.ok) return gate.response;
  const { session } = gate;
  const { id } = await ctx.params;

  const row = await prisma.availabilityRule.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.role !== "ADMIN" && row.brokerId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.availabilityRule.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
