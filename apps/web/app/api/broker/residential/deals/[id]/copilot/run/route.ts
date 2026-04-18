import { requireBrokerDealAccess, requireBrokerResidentialSession } from "@/lib/broker/residential-access";
import { canMutateExecution } from "@/lib/deals/execution-access";
import { prisma } from "@/lib/db";
import { runCopilotForDealId } from "@/modules/deal-copilot/deal-copilot.service";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;
  const { id: dealId } = await context.params;
  const deal = await requireBrokerDealAccess(session.userId, dealId, session.role === "ADMIN");
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { role: true } });
  if (!user || !canMutateExecution(session.userId, user.role, deal)) {
    return Response.json({ error: "Only the assigned broker may run copilot" }, { status: 403 });
  }

  const result = await runCopilotForDealId(dealId, session.userId);
  return Response.json(result);
}
