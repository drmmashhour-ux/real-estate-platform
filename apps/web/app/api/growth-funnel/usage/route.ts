import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { checkGrowthPaywall } from "@/src/modules/growth-funnel/application/checkGrowthPaywall";
import { maxFreeAiDrafts, maxFreeSimulatorRuns } from "@/src/modules/growth-funnel/domain/usageLimits";
import { getOrCreateUsageCounter } from "@/src/modules/growth-funnel/infrastructure/growthFunnelRepository";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, role: true },
  });
  if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const counter = await getOrCreateUsageCounter(userId);
  const sim = await checkGrowthPaywall({ userId, plan: u.plan, role: u.role, kind: "simulator" });
  const draft = await checkGrowthPaywall({ userId, plan: u.plan, role: u.role, kind: "ai_draft" });

  return NextResponse.json({
    simulator: {
      used: counter.simulatorRuns,
      limit: maxFreeSimulatorRuns(),
      remaining: sim.remaining,
      allowed: sim.allowed,
    },
    aiDrafts: {
      used: counter.aiDrafts,
      limit: maxFreeAiDrafts(),
      remaining: draft.remaining,
      allowed: draft.allowed,
    },
    activationCompletedAt: counter.activationCompletedAt?.toISOString() ?? null,
    lastReturnVisitAt: counter.lastReturnVisitAt?.toISOString() ?? null,
  });
}
