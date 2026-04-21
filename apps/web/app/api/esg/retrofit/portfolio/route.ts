import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getRetrofitPortfolioSummary } from "@/modules/esg/esg-retrofit-planner.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });

  try {
    const summary = await getRetrofitPortfolioSummary(userId, user?.role);
    return NextResponse.json(summary);
  } catch {
    return NextResponse.json({ error: "Portfolio summary failed" }, { status: 500 });
  }
}
