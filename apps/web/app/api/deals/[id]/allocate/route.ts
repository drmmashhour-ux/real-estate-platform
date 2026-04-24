import { NextResponse } from "next/server";
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { authenticateDealParticipantRoute, canMutateExecution } from "@/lib/deals/execution-access";
import { requireDealExecutionV1 } from "@/lib/deals/pipeline-feature-guard";
import { prisma } from "@/lib/db";
import {
  DEAL_CAPITAL_ALLOCATION_ADVISORY,
  formatCapitalAllocationHeadline,
  proposeDealCapitalAllocation,
} from "@/modules/capital-allocator-ai/deal-capital-allocation.service";
import type { ExpectedReturnBand } from "@/modules/capital-allocator-ai/capital-allocator.types";

export const dynamic = "force-dynamic";

function parseReturnBand(v: unknown): ExpectedReturnBand | null {
  if (v === "LOW" || v === "MEDIUM" || v === "HIGH") return v;
  return null;
}

function serializeRow(row: {
  id: string;
  dealId: string;
  recommendedAmountCents: number;
  allocationPercent: number;
  reasoningJson: unknown;
  confidenceScore: number;
  brokerApprovalStatus: string;
  createdAt: Date;
  approvedAt: Date | null;
}) {
  const headline = formatCapitalAllocationHeadline(row.recommendedAmountCents, row.allocationPercent);
  return {
    id: row.id,
    dealId: row.dealId,
    recommendedAmountCents: row.recommendedAmountCents,
    allocationPercent: row.allocationPercent,
    reasoningJson: row.reasoningJson,
    confidenceScore: row.confidenceScore,
    brokerApprovalStatus: row.brokerApprovalStatus,
    createdAt: row.createdAt.toISOString(),
    approvedAt: row.approvedAt?.toISOString() ?? null,
    headline,
  };
}

/**
 * GET — latest allocation proposal or approved snapshot (deal participants; advisory).
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireDealExecutionV1();
  if (gated) return gated;

  const { id: dealId } = await context.params;
  const auth = await authenticateDealParticipantRoute(dealId);
  if (!auth.ok) return auth.response;

  const proposed = await prisma.dealCapitalAllocation.findFirst({
    where: { dealId, brokerApprovalStatus: "PROPOSED" },
    orderBy: { createdAt: "desc" },
  });
  const row =
    proposed ??
    (await prisma.dealCapitalAllocation.findFirst({
      where: { dealId, brokerApprovalStatus: "APPROVED" },
      orderBy: { createdAt: "desc" },
    }));

  return NextResponse.json({
    ok: true,
    advisory: DEAL_CAPITAL_ALLOCATION_ADVISORY,
    requiresBrokerApproval: true,
    latest: row ? serializeRow(row) : null,
  });
}

/**
 * POST — compute advisory allocation and persist as PROPOSED (broker must approve).
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
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

  let body: {
    totalDeployableCapitalCents?: number;
    expectedReturnBand?: unknown;
  } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const expectedReturnBand = parseReturnBand(body.expectedReturnBand);
  const totalRaw = body.totalDeployableCapitalCents;
  const totalDeployableCapitalCents =
    typeof totalRaw === "number" && Number.isFinite(totalRaw) ? Math.floor(totalRaw) : undefined;

  const proposal = await proposeDealCapitalAllocation({
    deal: auth.deal,
    totalDeployableCapitalCents: totalDeployableCapitalCents ?? null,
    expectedReturnBand: expectedReturnBand ?? null,
  });

  const created = await prisma.$transaction(async (tx) => {
    await tx.dealCapitalAllocation.updateMany({
      where: { dealId, brokerApprovalStatus: "PROPOSED" },
      data: { brokerApprovalStatus: "SUPERSEDED" },
    });
    return tx.dealCapitalAllocation.create({
      data: {
        dealId,
        recommendedAmountCents: proposal.recommendedAmountCents,
        allocationPercent: proposal.allocationPercent,
        reasoningJson: proposal.reasoningJson as object,
        confidenceScore: proposal.confidenceScore,
        brokerApprovalStatus: "PROPOSED",
        proposedByUserId: auth.userId,
      },
    });
  });

  const headline = formatCapitalAllocationHeadline(created.recommendedAmountCents, created.allocationPercent);

  return NextResponse.json({
    ok: true,
    advisory: DEAL_CAPITAL_ALLOCATION_ADVISORY,
    requiresBrokerApproval: true,
    headline,
    proposal: {
      ...serializeRow(created),
      justification: proposal.justification,
    },
  });
}

/**
 * PATCH — broker approves or rejects the latest PROPOSED allocation for this deal.
 */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
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

  let action: string | undefined;
  try {
    const body = (await request.json()) as { action?: string };
    action = body.action;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });
  }

  const latest = await prisma.dealCapitalAllocation.findFirst({
    where: { dealId, brokerApprovalStatus: "PROPOSED" },
    orderBy: { createdAt: "desc" },
  });
  if (!latest) {
    return NextResponse.json({ error: "No proposed allocation to review" }, { status: 404 });
  }

  const updated = await prisma.dealCapitalAllocation.update({
    where: { id: latest.id },
    data: {
      brokerApprovalStatus: action === "approve" ? "APPROVED" : "REJECTED",
      approvedByUserId: auth.userId,
      approvedAt: new Date(),
    },
  });

  return NextResponse.json({
    ok: true,
    advisory: DEAL_CAPITAL_ALLOCATION_ADVISORY,
    allocation: serializeRow(updated),
  });
}
