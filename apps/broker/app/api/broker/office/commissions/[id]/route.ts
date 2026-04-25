import { prisma } from "@repo/db";
import { brokerageOfficeFlags } from "@/config/feature-flags";
import { resolveBrokerOfficeRequest } from "@/lib/brokerage/resolve-office-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request, p: { params: Promise<{ id: string }> }) {
  const ctx = await resolveBrokerOfficeRequest(request, "commissionEngineV1");
  if ("error" in ctx) return ctx.error;
  const { id } = await p.params;

  const row = await prisma.brokerageCommissionCase.findFirst({
    where: {
      id,
      officeId: ctx.officeId,
      ...(ctx.access.canViewOfficeFinance ? {} : { brokerUserId: ctx.session.userId }),
    },
    include: { splits: true, deal: { select: { id: true, dealCode: true } } },
  });
  if (!row) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json({ commissionCase: row });
}
