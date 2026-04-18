import { brokerageOfficeFlags } from "@/config/feature-flags";
import { resolveBrokerOfficeRequest } from "@/lib/brokerage/resolve-office-api";
import { runCommissionForDeal } from "@/modules/commission-engine/commission-calculation.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ctx = await resolveBrokerOfficeRequest(request, "commissionEngineV1");
  if ("error" in ctx) return ctx.error;

  let body: { dealId?: string; grossCommissionCents?: number };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.dealId || typeof body.grossCommissionCents !== "number") {
    return Response.json({ error: "dealId and grossCommissionCents required" }, { status: 400 });
  }

  const result = await runCommissionForDeal({
    dealId: body.dealId,
    officeId: ctx.officeId,
    actorUserId: ctx.session.userId,
    grossCommissionCents: Math.floor(body.grossCommissionCents),
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }
  return Response.json(result);
}
