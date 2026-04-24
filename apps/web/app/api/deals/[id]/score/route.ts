import { NextResponse } from "next/server";
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { authenticateDealParticipantRoute, canMutateExecution } from "@/lib/deals/execution-access";
import { requireDealExecutionV1 } from "@/lib/deals/pipeline-feature-guard";
import { prisma } from "@/lib/db";
import {
  createBrokerDealScoreSnapshot,
  DEAL_SCORING_ADVISORY,
  getLatestBrokerDealScore,
} from "@/modules/deal/deal-scoring.service";

export const dynamic = "force-dynamic";

function serializeSnapshot(row: Awaited<ReturnType<typeof getLatestBrokerDealScore>>) {
  if (!row) return null;
  return {
    id: row.id,
    dealId: row.dealId,
    score: row.score,
    category: row.category,
    riskLevel: row.riskLevel,
    strengths: row.strengths,
    risks: row.risks,
    factors: row.factors,
    recommendation: row.recommendation,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * GET — latest persisted deal score for execution workspace (deal parties).
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireDealExecutionV1();
  if (gated) return gated;

  const { id: dealId } = await context.params;
  const auth = await authenticateDealParticipantRoute(dealId);
  if (!auth.ok) return auth.response;

  const latest = await getLatestBrokerDealScore(dealId);
  return NextResponse.json({
    ok: true,
    advisory: DEAL_SCORING_ADVISORY,
    latest: serializeSnapshot(latest),
  });
}

/**
 * POST — compute and persist a new DealScore snapshot (assigned broker / admin).
 */
export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireDealExecutionV1();
  if (gated) return gated;

  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { role: true },
  });
  if (!user || !canMutateExecution(auth.userId, user.role, auth.deal)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (auth.deal.status === "closed" || auth.deal.status === "cancelled") {
    return NextResponse.json(
      { error: "Deal is terminal — deal score is not recomputed." },
      { status: 409 },
    );
  }

  const result = await createBrokerDealScoreSnapshot(dealId);
  if (!result) {
    return NextResponse.json({ error: "Unable to compute deal score" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    advisory: DEAL_SCORING_ADVISORY,
    snapshot: {
      id: result.id,
      score: result.score,
      category: result.category,
      riskLevel: result.riskLevel,
      strengths: result.strengths,
      risks: result.risks,
      factors: result.factors,
      recommendation: result.recommendation,
      createdAt: result.createdAt.toISOString(),
    },
  });
}
