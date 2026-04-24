import { NextResponse } from "next/server";
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { prisma } from "@/lib/db";
import { asInputJsonValue } from "@/lib/prisma/as-input-json";
import { parseBrokerActionId } from "@/modules/broker-action-risk/action-id";
import { assessBrokerApprovalRisk } from "@/modules/broker-action-risk/risk.engine";

export const dynamic = "force-dynamic";

/**
 * POST — compute and persist risk assessment for a pending broker action (pre-signature / pre-approve).
 * `id` = URL-encoded action id (`offer_draft_approve:dealId:draftId` or `signature_session:dealId`).
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: rawActionId } = await context.params;
  const actionId = decodeURIComponent(rawActionId);
  const parsed = parseBrokerActionId(actionId);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid action id" }, { status: 400 });
  }

  const auth = await authenticateBrokerDealRoute(parsed.dealId);
  if (!auth.ok) return auth.response;
  if (auth.deal.brokerId !== auth.userId && auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Assignee broker only" }, { status: 403 });
  }

  if (parsed.kind === "offer_draft_approve") {
    let body: { draftId?: string };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      body = {};
    }
    if (body.draftId && body.draftId !== parsed.draftId) {
      return NextResponse.json({ error: "draftId does not match action id" }, { status: 400 });
    }
  }

  const assessment =
    parsed.kind === "offer_draft_approve" ?
      await assessBrokerApprovalRisk({
        kind: "offer_draft_approve",
        dealId: parsed.dealId,
        draftId: parsed.draftId,
      })
    : await assessBrokerApprovalRisk({ kind: "signature_session", dealId: parsed.dealId });

  const row = await prisma.actionRisk.create({
    data: {
      actionId,
      riskScore: assessment.riskScore,
      riskLevel: assessment.riskLevel,
      flagsJson: asInputJsonValue({
        flags: assessment.flags,
        warnings: assessment.warnings,
        blockers: assessment.blockers,
        kind: parsed.kind,
      }),
    },
  });

  return NextResponse.json({
    ok: true,
    assessmentId: row.id,
    actionId,
    riskScore: assessment.riskScore,
    riskLevel: assessment.riskLevel,
    warnings: assessment.warnings,
    blockers: assessment.blockers,
    flags: assessment.flags,
    hardBlocked: assessment.blockers.length > 0,
  });
}
