import { NextRequest } from "next/server";
import { getUserRole, isHubAdminRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

/**
 * GET /api/admin/bnhub/disputes — marketplace disputes (guest/host complaints).
 */
export async function GET(request: NextRequest) {
  const role = await getUserRole();
  if (!isHubAdminRole(role)) {
    return Response.json({ error: "Admin required" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status")?.trim();
  const take = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));

  const disputes = await prisma.dispute.findMany({
    where: status ? { status: status as never } : undefined,
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      bookingId: true,
      status: true,
      claimant: true,
      description: true,
      complaintCategory: true,
      urgencyLevel: true,
      createdAt: true,
      aiAssistantRecommendation: true,
      aiAssistantSummary: true,
      aiAssistantGeneratedAt: true,
      listing: { select: { id: true, title: true, city: true } },
      booking: {
        select: {
          id: true,
          checkIn: true,
          checkOut: true,
          guest: { select: { name: true, email: true } },
        },
      },
    },
  });

  return Response.json({
    disputes: disputes.map((d) => ({
      id: d.id,
      bookingId: d.bookingId,
      status: d.status,
      claimant: d.claimant,
      description: d.description,
      complaintCategory: d.complaintCategory,
      urgencyLevel: d.urgencyLevel,
      listing: d.listing,
      createdAt: d.createdAt.toISOString(),
      checkIn: d.booking.checkIn.toISOString(),
      checkOut: d.booking.checkOut.toISOString(),
      guestName: d.booking.guest.name,
      guestEmail: d.booking.guest.email,
      aiAssistantRecommendation: d.aiAssistantRecommendation,
      aiAssistantSummary: d.aiAssistantSummary,
      aiAssistantGeneratedAt: d.aiAssistantGeneratedAt?.toISOString() ?? null,
    })),
  });
}
