import { NextRequest } from "next/server";
import { getUserRole, isHubAdminRole } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { analyzeDisputeForAssistant } from "@/lib/bnhub/dispute-ai-assistant";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const role = await getUserRole();
  if (!isHubAdminRole(role)) {
    return Response.json({ error: "Admin required" }, { status: 403 });
  }
  const { id } = await params;
  const dispute = await prisma.dispute.findUnique({
    where: { id },
    include: {
      listing: { select: { id: true, title: true, city: true, ownerId: true } },
      booking: {
        select: {
          id: true,
          checkIn: true,
          checkOut: true,
          nights: true,
          totalCents: true,
          status: true,
          guest: { select: { id: true, name: true, email: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        take: 60,
        select: { id: true, body: true, senderId: true, isInternal: true, createdAt: true },
      },
    },
  });
  if (!dispute) return Response.json({ error: "Not found" }, { status: 404 });

  const [bookingMessages, checklist] = await Promise.all([
    prisma.bookingMessage.findMany({
      where: { bookingId: dispute.bookingId },
      orderBy: { createdAt: "asc" },
      take: 80,
      select: { id: true, body: true, senderId: true, createdAt: true },
    }),
    prisma.bnhubBookingChecklistItem.findMany({
      where: { bookingId: dispute.bookingId },
      select: { itemKey: true, label: true, confirmed: true, note: true },
    }),
  ]);

  return Response.json({
    dispute: {
      id: dispute.id,
      bookingId: dispute.bookingId,
      status: dispute.status,
      claimant: dispute.claimant,
      description: dispute.description,
      complaintCategory: dispute.complaintCategory,
      urgencyLevel: dispute.urgencyLevel,
      createdAt: dispute.createdAt.toISOString(),
      aiAssistantRecommendation: dispute.aiAssistantRecommendation,
      aiAssistantSummary: dispute.aiAssistantSummary,
      aiAssistantGeneratedAt: dispute.aiAssistantGeneratedAt?.toISOString() ?? null,
      listing: dispute.listing,
      booking: {
        ...dispute.booking,
        checkIn: dispute.booking.checkIn.toISOString(),
        checkOut: dispute.booking.checkOut.toISOString(),
      },
      disputeMessages: dispute.messages.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
      })),
      bookingMessages: bookingMessages.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
      })),
      checklist,
    },
  });
}

/** POST body: { action: "run_ai_assistant" } — stores suggestion on dispute row. */
export async function POST(request: NextRequest, { params }: Params) {
  const role = await getUserRole();
  if (!isHubAdminRole(role)) {
    return Response.json({ error: "Admin required" }, { status: 403 });
  }
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { action?: string };
  if (body.action !== "run_ai_assistant") {
    return Response.json({ error: "action must be run_ai_assistant" }, { status: 400 });
  }

  const result = await analyzeDisputeForAssistant(id);
  await prisma.dispute.update({
    where: { id },
    data: {
      aiAssistantRecommendation: result.recommendation,
      aiAssistantSummary: `[${result.source}] ${result.summary}`,
      aiAssistantGeneratedAt: new Date(),
    },
  });

  return Response.json({
    recommendation: result.recommendation,
    summary: result.summary,
    source: result.source,
  });
}
