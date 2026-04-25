import { prisma } from "@repo/db";
import { requireBrokerDealAccess, requireBrokerResidentialSession } from "@/lib/broker/residential-access";
import { logDealExecutionEvent } from "@/lib/deals/execution-events";
import { buildPackagePrefill } from "@/modules/form-mapping/package-prefill.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;
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

  const prefill = buildPackagePrefill(full, templateKey);
  await logDealExecutionEvent({
    eventType: "document_prefill_run",
    userId: session.userId,
    dealId,
    metadata: { templateKey, channel: "broker_residential" },
  });

  return Response.json({
    prefill,
    disclaimer: "Prefill assistance only — transcribe into the official publisher form in use.",
  });
}
