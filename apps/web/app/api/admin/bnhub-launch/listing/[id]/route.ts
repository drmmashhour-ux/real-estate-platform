import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { applyBnhubLaunchPromotionFlags } from "@/lib/bnhub/bnhub-launch-service";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const adminId = await getGuestId();
  if (!adminId || !(await isPlatformAdmin(adminId))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!id?.trim()) {
    return Response.json({ error: "Missing listing id" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const newListing = body.newListing === true;
  const specialOffer = body.specialOffer === true;
  const visibilityBoost = body.visibilityBoost === true;
  const visibilityOnly = body.visibilityOnly === true;
  const discountRaw = body.discountPercent;
  const discountPercent =
    discountRaw == null ? null : typeof discountRaw === "number" ? discountRaw : Number(discountRaw);

  try {
    await applyBnhubLaunchPromotionFlags({
      listingId: id.trim(),
      newListing,
      specialOffer,
      visibilityBoost,
      visibilityOnly,
      discountPercent: Number.isFinite(discountPercent) ? discountPercent : null,
    });
    return Response.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed";
    return Response.json({ error: msg }, { status: 400 });
  }
}
