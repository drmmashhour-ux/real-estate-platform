import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma";
import { getAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sybnbHotelLeadPatchSchema } from "@/lib/sybnb/sybnb-hotel-lead-schema";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ id: string }> };

/** ORDER SYBNB-52 — Admin: update lead (status, notes, contact fields). */
export async function PATCH(req: Request, ctx: RouteCtx): Promise<Response> {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!id?.trim()) {
    return NextResponse.json({ ok: false, error: "invalid_id" }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = sybnbHotelLeadPatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "validation", details: parsed.error.flatten() }, { status: 400 });
  }

  const patch = parsed.data;
  const data: Prisma.SybnbHotelLeadUpdateInput = {};
  if (patch.name !== undefined) data.name = patch.name;
  if (patch.phone !== undefined) data.phone = patch.phone;
  if (patch.city !== undefined) data.city = patch.city;
  if (patch.status !== undefined) data.status = patch.status;
  if (patch.notes !== undefined) data.notes = patch.notes === "" ? null : patch.notes;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: false, error: "empty_patch" }, { status: 400 });
  }

  try {
    const row = await prisma.sybnbHotelLead.update({
      where: { id: id.trim() },
      data,
    });

    return NextResponse.json({
      ok: true,
      lead: {
        ...row,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
}
