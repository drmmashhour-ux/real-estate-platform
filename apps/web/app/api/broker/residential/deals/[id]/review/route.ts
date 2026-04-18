import { prisma } from "@/lib/db";
import { requireBrokerDealAccess, requireBrokerResidentialSession } from "@/lib/broker/residential-access";

export const dynamic = "force-dynamic";

/** Review snapshot: pending copilot rows + recent execution audit entries (broker-only). */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;
  const { id } = await context.params;

  const deal = await requireBrokerDealAccess(session.userId, id, session.role === "ADMIN");
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  const [pendingSuggestions, recentAudit] = await Promise.all([
    prisma.dealCopilotSuggestion.findMany({
      where: { dealId: id, status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.dealExecutionAuditLog.findMany({
      where: { dealId: id },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: { id: true, actionKey: true, payload: true, createdAt: true, actorUserId: true },
    }),
  ]);

  return Response.json({
    pendingSuggestions,
    recentAudit,
    disclaimer: "Review data is assistive — broker remains responsible for OACIQ compliance.",
  });
}
