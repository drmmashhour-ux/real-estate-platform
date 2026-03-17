import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

/**
 * GET /api/admin/disputes
 * List disputes with optional filters: status, urgencyLevel, listingId
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const urgencyLevel = searchParams.get("urgencyLevel");
    const listingId = searchParams.get("listingId");
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (urgencyLevel) where.urgencyLevel = urgencyLevel;
    if (listingId) where.listingId = listingId;

    const disputes = await prisma.dispute.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          select: {
            id: true,
            checkIn: true,
            checkOut: true,
            status: true,
            guest: { select: { id: true, name: true, email: true } },
          },
        },
        listing: { select: { id: true, title: true, city: true, ownerId: true } },
      },
    });

    return Response.json({ disputes });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch disputes" }, { status: 500 });
  }
}
