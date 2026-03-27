import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { getUserRole } from "@/lib/auth/session";
import { assertConversationAccess } from "@/lib/immo/conversation-access";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const userId = await getGuestId();
  const guestSessionId = req.headers.get("x-immo-guest-id");
  const roleCookie = await getUserRole();
  const dbRole = userId
    ? (await prisma.user.findUnique({ where: { id: userId }, select: { role: true } }))?.role ?? null
    : null;

  const access = await assertConversationAccess({
    conversationId: id,
    userId,
    guestSessionId,
    platformRoleCookie: roleCookie,
    dbRole,
  });
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const url = new URL(req.url);
  const after = url.searchParams.get("after");
  const markRead = url.searchParams.get("markRead") === "1";

  if (markRead && access.role === "expert" && userId) {
    const expert = await prisma.mortgageExpert.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (expert) {
      await prisma.crmConversation.updateMany({
        where: { id, expertId: expert.id },
        data: { expertLastReadAt: new Date() },
      });
    }
  }

  const messages = await prisma.crmMessage.findMany({
    where: {
      conversationId: id,
      ...(after ? { createdAt: { gt: new Date(after) } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: { id: true, sender: true, content: true, createdAt: true },
  });

  const convo = await prisma.crmConversation.findUnique({
    where: { id },
    include: {
      lead: { select: { id: true, name: true, email: true, phone: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({
    conversation: convo
      ? {
          id: convo.id,
          leadId: convo.leadId,
          expertId: convo.expertId,
          lead: convo.lead,
          user: convo.user,
          updatedAt: convo.updatedAt.toISOString(),
        }
      : null,
    messages: messages.map((m) => ({
      id: m.id,
      sender: m.sender,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}
