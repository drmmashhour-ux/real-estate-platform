import { NextResponse } from "next/server";
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { prisma } from "@/lib/db";
import type { SignatureProviderId } from "@/modules/signature/signature.types";
import { sendApprovedOfferDraft } from "@/modules/offer-draft/offer-draft.service";

export const dynamic = "force-dynamic";

/** POST — never auto-sends; requires APPROVED offer draft + APPROVED/signed promise artifact. Optional / env-mandatory executed autopilot pipeline gate (see SIGNATURE_CONTROL_REQUIRE_EXECUTED_PIPELINE_FOR_OFFER_SEND). */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;
  if (auth.deal.brokerId !== auth.userId && auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Assignee broker only" }, { status: 403 });
  }

  let body: {
    draftId?: string;
    channel?: "EMAIL" | "ESIGN_ENVELOPE";
    autopilotActionPipelineId?: string | null;
    esign?: { provider: SignatureProviderId; participants: { name: string; role: string; email?: string | null }[] };
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const draftId = typeof body.draftId === "string" ? body.draftId.trim() : "";
  if (!draftId) {
    return NextResponse.json({ error: "draftId required" }, { status: 400 });
  }
  const channel = body.channel === "ESIGN_ENVELOPE" ? "ESIGN_ENVELOPE" : "EMAIL";

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { role: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const sent = await sendApprovedOfferDraft({
      dealId,
      draftId,
      brokerUserId: auth.userId,
      role: user.role,
      channel,
      esign:
        channel === "ESIGN_ENVELOPE" && body.esign?.provider && body.esign.participants?.length ?
          { provider: body.esign.provider, participants: body.esign.participants }
        : undefined,
    });
    return NextResponse.json({
      ok: true,
      offerAi: true,
      draft: { id: sent.id, status: sent.status, sentAt: sent.sentAt?.toISOString() ?? null },
    });
  } catch (e) {
    const err = e as Error;
    const code = err.message;
    const status =
      code === "DRAFT_NOT_FOUND" ? 404
      : code === "DRAFT_NOT_APPROVED" || code === "PROMISE_ARTIFACT_NOT_APPROVED" ?
        409
      : code === "ALREADY_SENT" ? 409
      : code === "LEGAL_DOCUMENTS_ENGINE_DISABLED" ? 503
      : code === "AUTOPILOT_EXECUTED_PIPELINE_REQUIRED" ||
          code === "AUTOPILOT_PIPELINE_NOT_FOUND" ||
          code === "AUTOPILOT_PIPELINE_NOT_EXECUTED" ||
          code === "AUTOPILOT_PIPELINE_NOT_AI_PREP" ||
          code === "AUTOPILOT_PIPELINE_WRONG_TYPE_FOR_OFFER_SEND" ?
        403
      : 400;
    return NextResponse.json({ error: code }, { status });
  }
}
