import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { isMortgageExpertRole } from "@/lib/marketplace/mortgage-role";

export const dynamic = "force-dynamic";

/**
 * Expert: assigned conversations. Admin: all recent threads.
 */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 });

  const baseInclude = {
    lead: { select: { id: true, name: true, email: true, phone: true, status: true } },
    user: { select: { id: true, name: true, email: true } },
    messages: {
      orderBy: { createdAt: "desc" as const },
      take: 1,
      select: { content: true, sender: true, createdAt: true },
    },
  };

  if (user.role === "ADMIN") {
    const rows = await prisma.crmConversation.findMany({
      orderBy: { updatedAt: "desc" },
      take: 150,
      include: baseInclude,
    });
    return NextResponse.json({ conversations: rows.map(serializeConversation) });
  }

  if (isMortgageExpertRole(user.role)) {
    const expert = await prisma.mortgageExpert.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!expert) return NextResponse.json({ error: "Not a mortgage expert" }, { status: 403 });

    const rows = await prisma.crmConversation.findMany({
      where: { expertId: expert.id },
      orderBy: { updatedAt: "desc" },
      take: 150,
      include: baseInclude,
    });
    return NextResponse.json({ conversations: rows.map(serializeConversation) });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

function serializeConversation(
  c: {
    id: string;
    userId: string | null;
    guestSessionId: string | null;
    expertId: string | null;
    leadId: string | null;
    expertLastReadAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    lead: {
      id: string;
      name: string;
      email: string;
      phone: string;
      status: string;
    } | null;
    user: { id: string; name: string | null; email: string } | null;
    messages: { content: string; sender: string; createdAt: Date }[];
  }
) {
  const last = c.messages[0];
  return {
    id: c.id,
    userId: c.userId,
    guestSessionId: c.guestSessionId,
    expertId: c.expertId,
    leadId: c.leadId,
    expertLastReadAt: c.expertLastReadAt?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    lead: c.lead,
    clientUser: c.user,
    lastMessage: last
      ? { content: last.content.slice(0, 240), sender: last.sender, createdAt: last.createdAt.toISOString() }
      : null,
  };
}
