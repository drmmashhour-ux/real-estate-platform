import { NextResponse } from "next/server";
import { intelligenceFlags } from "@/config/feature-flags";
import { requireUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db";
import { logMemoryAudit } from "@/lib/marketplace-memory/memory-audit";

export const dynamic = "force-dynamic";

/** POST /api/memory/reset — clear events, insights, sessions; reset summaries (keeps personalization toggle). */
export async function POST() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  if (!intelligenceFlags.marketplaceMemoryEngineV1) {
    return NextResponse.json({ ok: false, error: "feature_disabled" }, { status: 404 });
  }

  await prisma.userMemoryProfile.upsert({
    where: { userId: auth.user.id },
    create: { userId: auth.user.id },
    update: {},
  });

  await prisma.$transaction([
    prisma.userMemoryEvent.deleteMany({ where: { userId: auth.user.id } }),
    prisma.userMemoryInsight.deleteMany({ where: { userId: auth.user.id } }),
    prisma.userMemorySession.deleteMany({ where: { userId: auth.user.id } }),
    prisma.userMemoryProfile.update({
      where: { userId: auth.user.id },
      data: {
        intentSummaryJson: {},
        preferenceSummaryJson: {},
        behaviorSummaryJson: {},
        financialProfileJson: null,
        esgProfileJson: null,
        riskProfileJson: null,
        lastUpdatedAt: new Date(),
      },
    }),
  ]);

  void logMemoryAudit({
    userId: auth.user.id,
    actionType: "memory_reset",
    summary: "User reset marketplace memory",
    actorId: auth.user.id,
  }).catch(() => null);

  return NextResponse.json({ ok: true });
}
