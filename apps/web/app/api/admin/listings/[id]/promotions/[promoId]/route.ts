import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { loadStayListingForEditor } from "@/lib/admin/stay-listing-edit";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; promoId: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id, promoId } = await ctx.params;
  const { forbidden } = await loadStayListingForEditor(id, userId);
  if (forbidden) return Response.json({ error: "Forbidden" }, { status: 403 });

  const existing = await prisma.bnhubHostListingPromotion.findFirst({
    where: { id: promoId, listingId: id },
  });
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: Prisma.BnhubHostListingPromotionUpdateInput = {};
  if (typeof body.title === "string" || typeof body.label === "string") {
    data.label = String(body.title ?? body.label).trim() || null;
  }
  if (body.discountPct != null || body.discountPercent != null) {
    const d = Number(body.discountPct ?? body.discountPercent);
    if (Number.isFinite(d) && d > 0 && d <= 100) data.discountPercent = Math.round(d);
  }
  if (body.startDate) data.startDate = new Date(String(body.startDate));
  if (body.endDate) data.endDate = new Date(String(body.endDate));
  if (typeof body.isActive === "boolean") data.active = body.isActive;

  const promotion = await prisma.bnhubHostListingPromotion.update({
    where: { id: promoId },
    data,
  });
  return Response.json({ promotion });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id, promoId } = await ctx.params;
  const { forbidden } = await loadStayListingForEditor(id, userId);
  if (forbidden) return Response.json({ error: "Forbidden" }, { status: 403 });

  const existing = await prisma.bnhubHostListingPromotion.findFirst({
    where: { id: promoId, listingId: id },
  });
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.bnhubHostListingPromotion.delete({ where: { id: promoId } });
  return Response.json({ ok: true });
}
