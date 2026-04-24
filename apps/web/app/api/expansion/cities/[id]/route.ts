import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  isActive: z.boolean().optional(),
  listingsEnabled: z.boolean().optional(),
  searchPagesEnabled: z.boolean().optional(),
  growthEngineEnabled: z.boolean().optional(),
  expansionCountryId: z.string().nullable().optional(),
  status: z.enum(["testing", "active"]).optional(),
});

/**
 * PATCH /api/expansion/cities/[id] — toggle market readiness (admin; no automatic cross-region rules).
 */
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await ctx.params;
  if (!id?.trim()) return NextResponse.json({ error: "id_required" }, { status: 400 });

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const update: Record<string, unknown> = {};
  if (data.isActive !== undefined) update.isActive = data.isActive;
  if (data.listingsEnabled !== undefined) update.listingsEnabled = data.listingsEnabled;
  if (data.searchPagesEnabled !== undefined) update.searchPagesEnabled = data.searchPagesEnabled;
  if (data.growthEngineEnabled !== undefined) update.growthEngineEnabled = data.growthEngineEnabled;
  if (data.expansionCountryId !== undefined) update.expansionCountryId = data.expansionCountryId;
  if (data.status !== undefined) update.status = data.status;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "no_fields" }, { status: 400 });
  }

  try {
    const row = await prisma.city.update({
      where: { id: id.trim() },
      data: update as Prisma.CityUpdateInput,
      select: {
        id: true,
        slug: true,
        name: true,
        isActive: true,
        listingsEnabled: true,
        status: true,
        expansionCountryId: true,
      },
    });
    return NextResponse.json({ success: true, city: row });
  } catch {
    return NextResponse.json({ error: "update_failed" }, { status: 400 });
  }
}
