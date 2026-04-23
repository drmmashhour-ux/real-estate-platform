import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { canViewCapitalDeal } from "@/modules/amf-capital/amf-access.service";
import { getCapitalDealDetail } from "@/modules/amf-capital/amf-capital.service";

/**
 * GET /api/amf-capital/deals/[id]
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const userId = await getGuestId();
    const user = userId ?
      await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
    : null;

    const allowed = await canViewCapitalDeal(id, userId, user?.role ?? null);
    if (!allowed) {
      return Response.json({ error: "Forbidden or not found" }, { status: 403 });
    }

    const deal = await getCapitalDealDetail(id);
    if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

    return Response.json({ deal });
  } catch (e) {
    console.error(e);
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
