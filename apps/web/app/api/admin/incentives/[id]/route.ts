import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminSession();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id } = await ctx.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (body.title != null) data.title = String(body.title);
  if (body.description != null) data.description = String(body.description);
  if (body.jurisdiction != null) data.jurisdiction = String(body.jurisdiction);
  if (body.active != null) data.active = Boolean(body.active);
  if (body.externalLink !== undefined) data.externalLink = body.externalLink == null ? null : String(body.externalLink);
  if (body.notes !== undefined) data.notes = body.notes == null ? null : String(body.notes);
  if (body.sortOrder != null) data.sortOrder = Number(body.sortOrder);

  const row = await prisma.incentiveProgramConfig.update({
    where: { id },
    data: data as any,
  });

  return NextResponse.json({ incentive: row });
}

export async function DELETE(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminSession();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id } = await ctx.params;
  await prisma.incentiveProgramConfig.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
