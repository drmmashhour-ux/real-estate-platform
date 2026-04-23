import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { assertAdminResponse } from "@/lib/admin/assert-admin";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const err = await assertAdminResponse();
  if (err) return err;
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string") data.name = body.name.trim();
  if (typeof body.quote === "string") data.quote = body.quote.trim();
  if (typeof body.role === "string") data.role = body.role.trim() || null;
  if (typeof body.city === "string") data.city = body.city.trim() || null;
  if (typeof body.image === "string") data.image = body.image.trim() || null;
  if (typeof body.rating === "number") data.rating = Math.min(5, Math.max(1, body.rating));
  if (typeof body.featured === "boolean") data.featured = body.featured;
  if (typeof body.isApproved === "boolean") data.isApproved = body.isApproved;

  try {
    const row = await prisma.testimonial.update({
      where: { id },
      data,
    });
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
    await prisma.testimonial.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
