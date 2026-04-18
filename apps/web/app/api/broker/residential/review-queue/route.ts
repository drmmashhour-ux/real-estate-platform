import { prisma } from "@/lib/db";
import { requireBrokerResidentialSession } from "@/lib/broker/residential-access";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireBrokerResidentialSession({ requireDashboardFlag: true });
  if ("response" in session) return session.response;

  const deals = await prisma.deal.findMany({
    where: { brokerId: session.userId },
    select: { id: true },
  });
  const ids = deals.map((d) => d.id);
  if (ids.length === 0) return Response.json({ documents: [], suggestions: [] });

  const [documents, suggestions] = await Promise.all([
    prisma.dealDocument.findMany({
      where: { dealId: { in: ids }, workflowStatus: "broker_review" },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: { id: true, dealId: true, type: true, templateKey: true, workflowStatus: true, createdAt: true },
    }),
    prisma.dealCopilotSuggestion.findMany({
      where: { dealId: { in: ids }, status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        dealId: true,
        title: true,
        summary: true,
        severity: true,
        suggestionType: true,
        createdAt: true,
      },
    }),
  ]);

  return Response.json({ documents, suggestions });
}
