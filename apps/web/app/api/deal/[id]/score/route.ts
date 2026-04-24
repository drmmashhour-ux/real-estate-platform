import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";

import { getGuestId } from "@/lib/auth/session";
import { findDealForUser } from "@/lib/deals/deal-party-access";
import { prisma } from "@repo/db";
import { computeDealIntelligenceSnapshot } from "@/modules/deal/deal.service";
import { getLatestCloseProbability } from "@/modules/deal/close-probability.service";

export const dynamic = "force-dynamic";

const ADVISORY =
  "Advisory, rule-based estimate only — not a prediction of closing, legal outcome, or investment performance.";

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

  const [snapshot, closeProbabilityAi] = await Promise.all([
    computeDealIntelligenceSnapshot(id),
    getLatestCloseProbability(id),
  ]);
  if (!snapshot) {
    return NextResponse.json({ error: "Unable to compute" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    advisory: ADVISORY,
    snapshot,
    closeProbabilityAi: closeProbabilityAi
      ? {
          id: closeProbabilityAi.id,
          probability: closeProbabilityAi.probability,
          category: closeProbabilityAi.category,
          drivers: closeProbabilityAi.drivers,
          risks: closeProbabilityAi.risks,
          createdAt: closeProbabilityAi.createdAt.toISOString(),
        }
      : null,
  });
}
