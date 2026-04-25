import { brokerageOfficeFlags } from "@/config/feature-flags";
import { roleCanApproveCommissions } from "@/lib/brokerage/office-access";
import { resolveBrokerOfficeRequest } from "@/lib/brokerage/resolve-office-api";
import { markPayoutPaid } from "@/modules/brokerage-payouts/payout.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, p: { params: Promise<{ id: string }> }) {
  const ctx = await resolveBrokerOfficeRequest(request, "brokerPayoutsV1");
  if ("error" in ctx) return ctx.error;
  if (!roleCanApproveCommissions(ctx.access.membership.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await p.params;
  const payout = await markPayoutPaid(id, ctx.officeId, ctx.session.userId);
  return Response.json({ payout });
}
