import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { subscribeInvestment } from "@/modules/amf-capital/amf-capital.service";

/**
 * POST /api/amf-capital/deals/[id]/invest
 * Confirms subscription after compliance gates (KYC, accreditation, disclosures).
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const { id: capitalDealId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const investorId = typeof body.investorId === "string" ? body.investorId : "";
    const amount = typeof body.amount === "number" ? body.amount : NaN;
    const equityPercentage =
      typeof body.equityPercentage === "number" ? body.equityPercentage : undefined;

    if (!investorId || !Number.isFinite(amount) || amount <= 0) {
      return Response.json({ error: "investorId and positive amount required" }, { status: 400 });
    }

    const inv = await prisma.amfInvestor.findUnique({
      where: { id: investorId },
      select: { userId: true },
    });
    if (!inv) return Response.json({ error: "Investor not found" }, { status: 404 });
    if (inv.userId && inv.userId !== userId) {
      return Response.json({ error: "Investor profile not linked to session" }, { status: 403 });
    }

    const row = await subscribeInvestment({
      capitalDealId,
      investorId,
      amount,
      equityPercentage: equityPercentage ?? null,
    });

    return Response.json({ investment: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    const status = msg === "Forbidden" ? 403 : msg.includes("must") || msg.includes("VERIFIED") ? 409 : 500;
    console.error(e);
    return Response.json({ error: msg }, { status });
  }
}
