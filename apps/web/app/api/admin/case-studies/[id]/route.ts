import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertAdminResponse } from "@/lib/admin/assert-admin";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const err = await assertAdminResponse();
  if (err) return err;
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const data: Record<string, unknown> = {};
  if (typeof body.title === "string") data.title = body.title.trim();
  if (typeof body.summary === "string") data.summary = body.summary.trim();
  if (typeof body.challenge === "string") data.challenge = body.challenge.trim();
  if (typeof body.solution === "string") data.solution = body.solution.trim();
  if (typeof body.result === "string") data.result = body.result.trim();
  if (typeof body.city === "string") data.city = body.city.trim() || null;
  if (typeof body.image === "string") data.image = body.image.trim() || null;
  if (typeof body.featured === "boolean") data.featured = body.featured;
  if (typeof body.isPublished === "boolean") data.isPublished = body.isPublished;

  try {
    const row = await prisma.caseStudy.update({ where: { id }, data });
    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const err = await assertAdminResponse();
  if (err) return err;
  const { id } = await ctx.params;
  try {
    await prisma.caseStudy.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
