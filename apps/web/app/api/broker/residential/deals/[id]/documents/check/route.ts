import { prisma } from "@/lib/db";
import { requireBrokerDealAccess, requireBrokerResidentialSession } from "@/lib/broker/residential-access";
import { logDealExecutionEvent } from "@/lib/deals/execution-events";
import { runContractIntelligence } from "@/modules/contract-intelligence/contract-intelligence.engine";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;
  const { id: dealId } = await context.params;
  const deal = await requireBrokerDealAccess(session.userId, dealId, session.role === "ADMIN");
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  const full = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!full) return Response.json({ error: "Not found" }, { status: 404 });

  const result = await runContractIntelligence(full);
  await logDealExecutionEvent({
    eventType: "document_issue_detected",
    userId: session.userId,
    dealId,
    metadata: { issueCount: result.issues.length, channel: "broker_residential" },
  });

  return Response.json(result);
}
