import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { loadStayListingForEditor } from "@/lib/admin/stay-listing-edit";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const { row, forbidden } = await loadStayListingForEditor(id, userId);
  if (forbidden) return Response.json({ error: "Forbidden" }, { status: 403 });
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  const promotions = await prisma.bnhubHostListingPromotion.findMany({
    where: { listingId: id },
    orderBy: { startDate: "desc" },
  });
  return Response.json({ promotions });
}

/** POST { title?, discountPct, startDate, endDate, isActive? } */
export async function POST(req: NextRequest, ctx: Ctx) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const { row, forbidden } = await loadStayListingForEditor(id, userId);
  if (forbidden) return Response.json({ error: "Forbidden" }, { status: 403 });
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const discountPct = Number(body.discountPct ?? body.discountPercent);
  if (!Number.isFinite(discountPct) || discountPct <= 0 || discountPct > 100) {
    return Response.json({ error: "discountPct must be between 0 and 100" }, { status: 400 });
  }
  const startDate = new Date(String(body.startDate ?? ""));
  const endDate = new Date(String(body.endDate ?? ""));
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return Response.json({ error: "startDate and endDate required (ISO)" }, { status: 400 });
  }

  const label =
    typeof body.title === "string"
      ? body.title.trim()
      : typeof body.label === "string"
        ? body.label.trim()
        : null;
  const active = body.isActive !== false;

  const created = await prisma.bnhubHostListingPromotion.create({
    data: {
      listingId: id,
      label: label || null,
      discountPercent: Math.round(discountPct),
      startDate,
      endDate,
      active,
    },
  });
  return Response.json({ promotion: created });
}
