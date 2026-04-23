import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { acknowledgeDisclosure } from "@/modules/amf-capital/amf-capital.service";

/**
 * POST /api/amf-capital/deals/[id]/ack
 * Body: { disclosureId, investorId } — investorId must match session-linked AmfInvestor when set.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const { id: capitalDealId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const disclosureId = typeof body.disclosureId === "string" ? body.disclosureId : "";
    const investorIdParam = typeof body.investorId === "string" ? body.investorId : "";

    if (!disclosureId || !investorIdParam) {
      return Response.json({ error: "disclosureId and investorId required" }, { status: 400 });
    }

    const inv = await prisma.amfInvestor.findUnique({
      where: { id: investorIdParam },
      select: { id: true, userId: true },
    });
    if (!inv) return Response.json({ error: "Investor not found" }, { status: 404 });
    if (inv.userId && inv.userId !== userId) {
      return Response.json({ error: "Investor profile not linked to session" }, { status: 403 });
    }

    const ack = await acknowledgeDisclosure({
      capitalDealId,
      investorId: investorIdParam,
      disclosureId,
    });

    return Response.json({ acknowledgment: ack });
  } catch (e) {
    console.error(e);
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
