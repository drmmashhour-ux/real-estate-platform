import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

type ActionLogRow = {
  id: string;
  actionKey: string;
  targetEntityType: string;
  targetEntityId: string;
  status: string;
  decisionMode: string | null;
  createdAt: Date;
  payload: unknown;
};

export const dynamic = "force-dynamic";

async function requireHost(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, _count: { select: { shortTermListings: true } } },
  });
  if (!user) return null;
  return user.role === "HOST" || user.role === "ADMIN" || user._count.shortTermListings > 0;
}

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await requireHost(userId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [actions, recommendations, approvals] = await Promise.all([
    prisma.managerAiActionLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        actionKey: true,
        targetEntityType: true,
        targetEntityId: true,
        status: true,
        decisionMode: true,
        createdAt: true,
        payload: true,
      },
    }),
    prisma.managerAiRecommendation.findMany({
      where: { userId, status: "active" },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        agentKey: true,
        title: true,
        description: true,
        targetEntityType: true,
        targetEntityId: true,
        confidence: true,
        createdAt: true,
        suggestedAction: true,
      },
    }),
    prisma.managerAiApprovalRequest.findMany({
      where: { requesterId: userId, status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        actionKey: true,
        targetEntityType: true,
        targetEntityId: true,
        status: true,
        confidence: true,
        payload: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    actions: actions.map((a: ActionLogRow) => ({ ...a, createdAt: a.createdAt.toISOString() })),
    recommendations,
    approvals,
  });
}
