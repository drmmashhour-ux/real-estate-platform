import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { logDealExecutionEvent } from "@/lib/deals/execution-events";
import { canMutateExecution, loadDealWithActor } from "@/lib/deals/execution-access";
import { dealExecutionFlags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import { renderDealDraftBundle } from "@/modules/form-rendering/render.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  if (!dealExecutionFlags.formRenderingV1) {
    return Response.json({ error: "Form rendering disabled" }, { status: 403 });
  }
  const { id: dealId } = await context.params;
  const { deal, user } = await loadDealWithActor(dealId, userId);
  if (!deal || !user) return Response.json({ error: "Not found" }, { status: 404 });
  if (!canMutateExecution(userId, user.role, deal)) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body: { templateKey?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const templateKey = typeof body.templateKey === "string" ? body.templateKey : "promise_to_purchase_residential_qc";
  const full = await prisma.deal.findUnique({ where: { id: deal.id } });
  if (!full) return Response.json({ error: "Not found" }, { status: 404 });

  const bundle = renderDealDraftBundle(full, templateKey);
  await logDealExecutionEvent({
    eventType: "document_rendered",
    userId,
    dealId,
    metadata: { templateKey, sections: bundle.sections.length },
  });

  return Response.json({ bundle });
}
