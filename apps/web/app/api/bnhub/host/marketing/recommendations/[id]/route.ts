import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { MarketingAuthError, assertListingMarketingAccess } from "@/src/modules/bnhub-marketing/services/marketingAccess";
import { applyRecommendation, dismissRecommendation } from "@/src/modules/bnhub-marketing/services/marketingRecommendationService";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getGuestId();
    if (!userId) throw new MarketingAuthError("Sign in required", "UNAUTHORIZED");
    const { id } = await params;
    const body = (await request.json()) as { action: "apply" | "dismiss" };
    const rec = await prisma.bnhubMarketingRecommendation.findUniqueOrThrow({
      where: { id },
      select: { listingId: true },
    });
    await assertListingMarketingAccess(userId, rec.listingId);
    if (body.action === "dismiss") {
      await dismissRecommendation(id);
      return Response.json({ ok: true });
    }
    await applyRecommendation(id, userId);
    return Response.json({ ok: true });
  } catch (e) {
    if (e instanceof MarketingAuthError) {
      const st = e.code === "NOT_FOUND" ? 404 : e.code === "UNAUTHORIZED" ? 401 : 403;
      return Response.json({ error: e.message }, { status: st });
    }
    console.error(e);
    return Response.json({ error: "Failed" }, { status: 400 });
  }
}
