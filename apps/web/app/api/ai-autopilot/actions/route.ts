import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { userId } = await requireAuthenticatedUser();
  const { searchParams } = new URL(req.url);
  const draftId = searchParams.get("draftId") ?? undefined;
  const dealId = searchParams.get("dealId") ?? undefined;

  const actions = await prisma.aiAutopilotLayerAction.findMany({
    where: {
      userId,
      ...(draftId ? { draftId } : {}),
      ...(dealId ? { dealId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ actions, userId });
}
