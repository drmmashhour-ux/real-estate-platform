import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

/**
 * GET /api/admin/payout-holds
 * List payout holds with optional status/hostId filter.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // ON_HOLD | RELEASED | REFUNDED etc.
    const hostId = searchParams.get("hostId");
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (hostId) where.hostId = hostId;

    const holds = await prisma.payoutHold.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          select: {
            id: true,
            checkIn: true,
            status: true,
            listingId: true,
            listing: { select: { title: true, city: true } },
            guest: { select: { name: true, email: true } },
          },
        },
      },
    });

    return Response.json({ holds });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch payout holds" }, { status: 500 });
  }
}
