import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { getPlatformStats } from "@/modules/analytics/services/get-platform-stats";

export const dynamic = "force-dynamic";

function parseDays(raw: string | null): 1 | 7 | 30 {
  const n = parseInt(raw ?? "7", 10);
  if (n <= 1) return 1;
  if (n <= 7) return 7;
  return 30;
}

export async function GET(req: NextRequest) {
  const viewerId = await getGuestId();
  if (!viewerId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { role: true },
  });
  if (viewer?.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const days = parseDays(req.nextUrl.searchParams.get("days"));
  const data = await getPlatformStats(days);

  return NextResponse.json({ days, ...data });
}
