import { NextResponse } from "next/server";
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { prisma } from "@/lib/db";
import { approveOfferDraft } from "@/modules/offer-draft/offer-draft.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;
  if (auth.deal.brokerId !== auth.userId && auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Assignee broker only" }, { status: 403 });
  }

  let body: { draftId?: string; brokerConfirmed?: boolean; riskOverrideAcknowledged?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const draftId = typeof body.draftId === "string" ? body.draftId.trim() : "";
  if (!draftId) {
    return NextResponse.json({ error: "draftId required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { role: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const draft = await approveOfferDraft({
      dealId,
      draftId,
      brokerUserId: auth.userId,
      role: user.role,
      brokerConfirmed: body.brokerConfirmed === true,
      riskOverrideAcknowledged: user.role === "ADMIN" ? body.riskOverrideAcknowledged === true : false,
    });
    return NextResponse.json({
      ok: true,
      offerAi: true,
      draft: {
        id: draft.id,
        status: draft.status,
        promiseArtifactId: draft.promiseArtifactId,
      },
      nextStep:
        "Generate promise is created (AWAITING_APPROVAL). Broker must digitally sign and approve the legal artifact, then use Send.",
    });
  } catch (e) {
    const err = e as Error;
    const code = err.message;
    const status =
      code === "DRAFT_NOT_FOUND" ? 404
      : code === "DRAFT_IMMUTABLE" ? 409
      : code === "LEGAL_DOCUMENTS_ENGINE_DISABLED" ? 503
      : code === "APPROVAL_RISK_BLOCKED" ? 409
      : 400;
    if (code === "APPROVAL_RISK_BLOCKED") {
      const { assessBrokerApprovalRisk } = await import("@/modules/broker-action-risk/risk.engine");
      const r = await assessBrokerApprovalRisk({ kind: "offer_draft_approve", dealId, draftId });
      return NextResponse.json(
        {
          error: code,
          riskScore: r.riskScore,
          riskLevel: r.riskLevel,
          warnings: r.warnings,
          blockers: r.blockers,
          flags: r.flags,
        },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: code }, { status });
  }
}
