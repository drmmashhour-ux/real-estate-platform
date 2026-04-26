import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { findDealForUser } from "@/lib/deals/deal-party-access";
import { createCloseProbabilityPrediction } from "@/modules/deal/close-probability.service";

export const dynamic = "force-dynamic";

const ADVISORY =
  "Assistive, rule-based estimate only — not a guarantee of closing, financing approval, or legal outcome.";

/**
 * POST /api/deals/[id]/close-probability — compute and persist a CloseProbability snapshot; updates Deal.closeProbability (0–1).
 */
export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { id: dealId } = await context.params;
  const deal = await findDealForUser(dealId, userId, user.role as PlatformRole);
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (deal.status === "closed" || deal.status === "cancelled") {
    return NextResponse.json(
      { error: "Deal is terminal — close probability is not recomputed." },
      { status: 409 },
    );
  }

  const result = await createCloseProbabilityPrediction(dealId);
  if (!result) {
    return NextResponse.json({ error: "Unable to compute close probability" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    advisory: ADVISORY,
    prediction: {
      id: result.id,
      probability: result.probability,
      category: result.category,
      drivers: result.drivers,
      risks: result.risks,
      factors: result.factors,
      createdAt: result.createdAt.toISOString(),
    },
  });
}
