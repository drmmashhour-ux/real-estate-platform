import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { recomputePortfolioActionSummary } from "@/modules/esg/esg-action-portfolio.service";
import { logInfo } from "@/lib/logger";

export const dynamic = "force-dynamic";

const TAG = "[esg-action-portfolio]";

export async function POST() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await recomputePortfolioActionSummary(userId, user.role);
    logInfo(`${TAG} recompute api`, { userId });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Recompute failed" }, { status: 500 });
  }
}
