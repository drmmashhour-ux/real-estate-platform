import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/monetization/subscriptions
 * Query: userId?, status?, planId?, limit?
 * In production, restrict to admin role.
 */
export async function GET(request: NextRequest) {
  try {
    await getGuestId();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const planId = searchParams.get("planId") ?? undefined;
    const limit = Math.min(Number(searchParams.get("limit")) || 100, 500);

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (planId) where.planId = planId;

    const subscriptions = await prisma.planSubscription.findMany({
      where,
      include: { plan: true },
      orderBy: { currentPeriodEnd: "desc" },
      take: limit,
    });
    return Response.json({ subscriptions });
  } catch (e) {
    return Response.json({ error: "Failed to load subscriptions" }, { status: 500 });
  }
}
