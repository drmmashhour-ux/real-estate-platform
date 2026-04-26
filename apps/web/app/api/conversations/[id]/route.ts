import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import {
  canAccessConversationContext,
  canViewConversation,
} from "@/modules/messaging/services/messaging-permissions";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** GET /api/conversations/[id] */
export async function GET(_request: Request, context: Params) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await context.params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 });

  const conv = await prisma.conversation.findUnique({
    where: { id },
    include: {
      participants: { include: { user: { select: { id: true, name: true, email: true } } } },
      listing: { select: { id: true, title: true, listingCode: true } },
      fsboListing: { select: { id: true, title: true, listingCode: true } },
      offer: { select: { id: true, status: true, listingId: true } },
      contract: { select: { id: true, title: true, status: true } },
      appointment: { select: { id: true, title: true, startsAt: true, status: true } },
      brokerClient: { select: { id: true, fullName: true } },
    },
  });
  if (!conv) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!canViewConversation(user, conv, conv.participants)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const ctxOk = await canAccessConversationContext(user, conv);
  if (!ctxOk) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const myPart = conv.participants.find((p) => p.userId === userId);

  return NextResponse.json({
    conversation: {
      id: conv.id,
      type: conv.type,
      subject: conv.subject,
      lastMessageAt: conv.lastMessageAt?.toISOString() ?? null,
      createdAt: conv.createdAt.toISOString(),
      participants: conv.participants.map((p) => ({
        userId: p.userId,
        name: p.user.name,
        email: p.user.email,
        isArchived: p.isArchived,
        lastReadAt: p.lastReadAt?.toISOString() ?? null,
      })),
      context: {
        listing: conv.listing,
        fsboListing: conv.fsboListing,
        offer: conv.offer ? { id: conv.offer.id } : null,
        contract: conv.contract,
        appointment: conv.appointment
          ? { id: conv.appointment.id, title: conv.appointment.title }
          : null,
        brokerClient: conv.brokerClient,
      },
      viewer: {
        isArchived: myPart?.isArchived ?? false,
      },
    },
  });
}
