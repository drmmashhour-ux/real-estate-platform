import { prisma } from "@repo/db";
import { brokerageOfficeFlags } from "@/config/feature-flags";
import { resolveBrokerOfficeRequest } from "@/lib/brokerage/resolve-office-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await resolveBrokerOfficeRequest(request, "commissionEngineV1");
  if ("error" in ctx) return ctx.error;

  const where = ctx.access.canViewOfficeFinance
    ? { officeId: ctx.officeId }
    : { officeId: ctx.officeId, brokerUserId: ctx.session.userId };

  const cases = await prisma.brokerageCommissionCase.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 80,
    include: {
      deal: { select: { id: true, dealCode: true, priceCents: true } },
      splits: { take: 40 },
    },
  });

  return Response.json({ cases });
}
