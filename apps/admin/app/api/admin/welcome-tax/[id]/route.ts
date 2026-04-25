import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireAdminSession } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminSession();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id } = await ctx.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (body.name != null) data.name = String(body.name);
  if (body.slug != null)
    data.slug = String(body.slug)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-");
  if (body.bracketsJson != null) data.bracketsJson = body.bracketsJson;
  if (body.rebateRulesJson !== undefined) data.rebateRulesJson = body.rebateRulesJson;
  if (body.active != null) data.active = Boolean(body.active);
  if (body.notes !== undefined) data.notes = body.notes == null ? null : String(body.notes);

  const row = await prisma.welcomeTaxMunicipalityConfig.update({
    where: { id },
    data: data as any,
  });

  return NextResponse.json({ config: row });
}

export async function DELETE(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminSession();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id } = await ctx.params;
  await prisma.welcomeTaxMunicipalityConfig.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
