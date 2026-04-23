import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { canManageCapitalDeal, canViewCapitalDeal } from "@/modules/amf-capital/amf-access.service";
import { getDealReportingSnapshot, recordDistribution } from "@/modules/amf-capital/amf-reporting.service";

/**
 * GET /api/amf-capital/deals/[id]/reporting — distributions + commitments snapshot.
 * POST — record distribution / return (issuer admin).
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getGuestId();
    const user = userId ?
      await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
    : null;
    const { id: capitalDealId } = await context.params;

    const allowed = await canViewCapitalDeal(capitalDealId, userId, user?.role ?? null);
    if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

    const snapshot = await getDealReportingSnapshot(capitalDealId);
    return Response.json(snapshot);
  } catch (e) {
    console.error(e);
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    const { id: capitalDealId } = await context.params;

    const ok = await canManageCapitalDeal(capitalDealId, userId, user?.role ?? null);
    if (!ok) return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const kind = typeof body.kind === "string" ? body.kind : "";
    const amount = typeof body.amount === "number" ? body.amount : NaN;
    if (!kind || !Number.isFinite(amount)) {
      return Response.json({ error: "kind and amount required" }, { status: 400 });
    }

    const investorId =
      typeof body.investorId === "string" ? body.investorId : undefined;

    const row = await recordDistribution({
      capitalDealId,
      investorId,
      kind,
      amount,
      notes: typeof body.notes === "string" ? body.notes : undefined,
    });

    return Response.json({ distribution: row });
  } catch (e) {
    console.error(e);
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
