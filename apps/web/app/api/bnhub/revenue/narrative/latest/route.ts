import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Latest saved deterministic narrative snapshot (same auth as `/api/revenue/narrative/latest`). */
export async function GET(req: NextRequest) {
  const scopeType = req.nextUrl.searchParams.get("scopeType")?.trim();
  const scopeId = req.nextUrl.searchParams.get("scopeId")?.trim();

  if (!scopeType || !scopeId) {
    return NextResponse.json({ error: "scopeType and scopeId are required" }, { status: 400 });
  }

  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (scopeType === "host") {
    if (scopeId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (scopeType === "investor" && scopeId === "platform") {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    const admin = await isPlatformAdmin(userId);
    const investorOk = user?.role === PlatformRole.INVESTOR;
    if (!admin && !investorOk) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else {
    return NextResponse.json({ error: "Unsupported scope for this endpoint" }, { status: 400 });
  }

  const row = await prisma.bnhubDashboardNarrativeSnapshot.findFirst({
    where: { scopeType, scopeId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, row });
}
