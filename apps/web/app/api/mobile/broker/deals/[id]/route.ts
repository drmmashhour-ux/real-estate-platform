import { requireMobileBrokerUser } from "@/lib/mobile/require-mobile-broker";
import { requireBrokerDealAccess } from "@/lib/broker/residential-access";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireMobileBrokerUser(request);
  if (!auth.ok) return auth.response;

  const { id: dealId } = await ctx.params;
  const deal = await requireBrokerDealAccess(auth.user.id, dealId, auth.isAdmin);
  if (!deal) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const [conditions, signatures, requests, bank] = await Promise.all([
    prisma.dealClosingCondition.findMany({
      where: { dealId },
      select: { id: true, conditionType: true, status: true, deadline: true },
      take: 40,
    }),
    prisma.signatureSession.findMany({
      where: { dealId },
      select: { id: true, status: true, updatedAt: true },
      take: 10,
    }),
    prisma.dealRequest.findMany({
      where: { dealId },
      select: { id: true, title: true, status: true, dueAt: true },
      take: 20,
    }),
    prisma.dealBankCoordination.findUnique({
      where: { dealId },
      select: { financingStatus: true, institutionName: true, lastContactAt: true },
    }),
  ]);

  return Response.json({
    kind: "mobile_broker_deal_summary_v1",
    deal: {
      id: deal.id,
      dealCode: deal.dealCode,
      status: deal.status,
      crmStage: deal.crmStage,
      priceCents: deal.priceCents,
      updatedAt: deal.updatedAt.toISOString(),
    },
    closingConditions: conditions.map((c) => ({
      id: c.id,
      type: c.conditionType,
      status: c.status,
      deadline: c.deadline?.toISOString() ?? null,
    })),
    signatureSessions: signatures.map((s) => ({
      id: s.id,
      status: s.status,
      updatedAt: s.updatedAt.toISOString(),
    })),
    dealRequests: requests.map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      dueAt: r.dueAt?.toISOString() ?? null,
    })),
    financing: bank
      ? {
          status: bank.financingStatus,
          institutionName: bank.institutionName,
          lastContactAt: bank.lastContactAt?.toISOString() ?? null,
        }
      : null,
  });
}
