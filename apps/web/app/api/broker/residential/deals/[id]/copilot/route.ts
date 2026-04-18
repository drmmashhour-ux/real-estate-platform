import { prisma } from "@/lib/db";
import { requireBrokerDealAccess, requireBrokerResidentialSession } from "@/lib/broker/residential-access";
import { loadCopilotSuggestions } from "@/modules/deal-copilot/deal-copilot.service";
import { suggestWorkflowPackage } from "@/modules/form-packages/workflow-matcher.service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;
  const { id: dealId } = await context.params;
  const deal = await requireBrokerDealAccess(session.userId, dealId, session.role === "ADMIN");
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  const full = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!full) return Response.json({ error: "Not found" }, { status: 404 });

  const [suggestions] = await Promise.all([loadCopilotSuggestions(dealId)]);
  const workflowHint = suggestWorkflowPackage(full);

  return Response.json({ suggestions, workflowHint });
}
