import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { caption?: unknown };
  const caption = typeof body.caption === "string" ? body.caption : null;
  if (caption == null) {
    return NextResponse.json({ error: "caption required" }, { status: 400 });
  }

  await prisma.machineGeneratedContent.update({
    where: { id },
    data: { caption: caption.slice(0, 8000) },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }
  const { id } = await ctx.params;
  await prisma.machineGeneratedContent.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
