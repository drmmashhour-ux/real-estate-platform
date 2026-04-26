import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";

import { getGuestId } from "@/lib/auth/session";
import { findDealForUser } from "@/lib/deals/deal-party-access";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { computeDealIntelligenceSnapshot } from "@/modules/deal/deal.service";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { id } = await context.params;
  const deal = await findDealForUser(id, userId, user.role as PlatformRole);
  if (!deal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const snapshot = await computeDealIntelligenceSnapshot(id);
  if (!snapshot) {
    return NextResponse.json({ error: "Unable to compute" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    suggestedAction: snapshot.suggestedAction,
    intelligenceStage: snapshot.intelligenceStage,
    riskLevel: snapshot.riskLevel,
    dealScore: snapshot.dealScore,
    closeProbability: snapshot.closeProbability,
    computedAt: snapshot.computedAt.toISOString(),
  });
}
