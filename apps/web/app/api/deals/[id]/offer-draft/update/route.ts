import { NextResponse } from "next/server";
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { updateOfferDraftFields } from "@/modules/offer-draft/offer-draft.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;
  if (auth.deal.brokerId !== auth.userId && auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Assignee broker only" }, { status: 403 });
  }

  let body: { draftId?: string; patch?: Record<string, unknown> };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const draftId = typeof body.draftId === "string" ? body.draftId.trim() : "";
  if (!draftId || !body.patch || typeof body.patch !== "object") {
    return NextResponse.json({ error: "draftId and patch required" }, { status: 400 });
  }

  try {
    const updated = await updateOfferDraftFields({
      dealId,
      draftId,
      actorBrokerUserId: auth.userId,
      patch: body.patch as Parameters<typeof updateOfferDraftFields>[0]["patch"],
    });
    return NextResponse.json({ ok: true, offerAi: true, draft: { id: updated.id, status: updated.status } });
  } catch (e) {
    const err = e as Error;
    const code = err.message;
    const status = code === "DRAFT_NOT_FOUND" ? 404 : code === "DRAFT_IMMUTABLE" ? 409 : 400;
    return NextResponse.json({ error: code }, { status });
  }
}
