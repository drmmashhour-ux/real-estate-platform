import { prisma } from "@/lib/db";
import { requireBrokerDealAccess, requireBrokerResidentialSession } from "@/lib/broker/residential-access";
import { buildChecklistForPackage } from "@/modules/deals/deal-checklist.service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;
  const { id: dealId } = await context.params;
  const deal = await requireBrokerDealAccess(session.userId, dealId, session.role === "ADMIN");
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  const full = await prisma.deal.findUnique({ where: { id: dealId }, select: { assignedFormPackageKey: true } });
  if (!full) return Response.json({ error: "Not found" }, { status: 404 });

  const items = buildChecklistForPackage(full.assignedFormPackageKey);
  return Response.json({
    items,
    disclaimer: "Checklist assists brokerage workflow — does not replace mandatory publisher forms.",
  });
}
