import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const take = Math.min(100, Math.max(1, Number(sp.get("take")) || 40));
  const hub = sp.get("hub")?.trim();

  const rows = await prisma.aiInteractionLog.findMany({
    where: hub ? { hub } : undefined,
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      userId: true,
      role: true,
      hub: true,
      feature: true,
      intent: true,
      source: true,
      model: true,
      feedback: true,
      createdAt: true,
      inputSummary: true,
      outputSummary: true,
    },
  });

  return NextResponse.json({ items: rows });
}
