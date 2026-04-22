import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { prisma } from "@/lib/db";
import { canManageCapital } from "@/modules/capital/capital-policy";
import { selectOffer } from "@/modules/capital/lender-offer.service";
import { canAccessPipelineDeal, requireAuthUser } from "@/lib/deals/guard-pipeline-deal";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, context: { params: Promise<{ offerId: string }> }) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { offerId } = await context.params;

  try {
    const offer = await prisma.lecipmPipelineDealLenderOffer.findUnique({
      where: { id: offerId },
      select: { dealId: true },
    });
    if (!offer) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const deal = await prisma.lecipmPipelineDeal.findUnique({ where: { id: offer.dealId } });
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canAccessPipelineDeal(auth.role, auth.userId, deal) || !canManageCapital(auth.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await selectOffer(offerId, auth.userId);
    return NextResponse.json({ offer: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    logError("[api.deals.offers.select.post]", { error: e });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
