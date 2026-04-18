import { NextRequest } from "next/server";
import { dealExecutionFlags } from "@/config/feature-flags";
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { logDraftingAudit } from "@/lib/deals/drafting-audit";
import { canMutateExecution } from "@/lib/deals/execution-access";
import { prisma } from "@/lib/db";
import { resolveCopilotSuggestion } from "@/modules/review/broker-review.service";

export const dynamic = "force-dynamic";

type ApplyBody = {
  action: "approve" | "reject" | "record_edit";
  suggestionId?: string;
  note?: string;
  editedSummary?: string;
};

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  if (!dealExecutionFlags.contractIntelligenceV1) {
    return Response.json({ error: "Drafting intelligence disabled" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({ where: { id: auth.userId }, select: { role: true } });
  if (!user || !canMutateExecution(auth.userId, user.role, auth.deal)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: ApplyBody;
  try {
    body = (await request.json()) as ApplyBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.action === "record_edit") {
    await logDraftingAudit({
      dealId,
      actorUserId: auth.userId,
      actionKey: "drafting_suggestion_edit_recorded",
      payload: {
        suggestionId: body.suggestionId ?? null,
        note: body.note ?? null,
        editedSummary: body.editedSummary ?? null,
      },
    });
    return Response.json({ ok: true, message: "Edit recorded — no document was modified automatically." });
  }

  if (!body.suggestionId || (body.action !== "approve" && body.action !== "reject")) {
    return Response.json({ error: "suggestionId and action approve|reject required" }, { status: 400 });
  }

  try {
    await resolveCopilotSuggestion({
      dealId,
      suggestionId: body.suggestionId,
      actorUserId: auth.userId,
      status: body.action === "approve" ? "approved" : "rejected",
      note: body.note,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "suggestion_not_found") {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    throw e;
  }

  return Response.json({ ok: true });
}
