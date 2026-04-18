import { prisma } from "@/lib/db";
import { requireBrokerDealAccess, requireBrokerResidentialSession } from "@/lib/broker/residential-access";
import { dealExecutionFlags } from "@/config/feature-flags";
import { logDealExecutionEvent } from "@/lib/deals/execution-events";
import { renderDealDraftBundle } from "@/modules/form-rendering/render.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;
  if (!dealExecutionFlags.formRenderingV1) return Response.json({ error: "Disabled" }, { status: 403 });
  const { id: dealId } = await context.params;
  const deal = await requireBrokerDealAccess(session.userId, dealId, session.role === "ADMIN");
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  let body: { templateKey?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const templateKey = typeof body.templateKey === "string" ? body.templateKey : "promise_to_purchase_residential_qc";
  const full = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!full) return Response.json({ error: "Not found" }, { status: 404 });

  const bundle = renderDealDraftBundle(full, templateKey);
  await logDealExecutionEvent({
    eventType: "document_rendered",
    userId: session.userId,
    dealId,
    metadata: { templateKey, channel: "broker_residential" },
  });

  return Response.json({ bundle });
}
