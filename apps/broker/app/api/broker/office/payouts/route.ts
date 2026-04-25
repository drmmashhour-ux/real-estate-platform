import { brokerageOfficeFlags } from "@/config/feature-flags";
import { roleCanViewOfficeFinance } from "@/lib/brokerage/office-access";
import { resolveBrokerOfficeRequest } from "@/lib/brokerage/resolve-office-api";
import { listPayouts } from "@/modules/brokerage-payouts/payout.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await resolveBrokerOfficeRequest(request, "brokerPayoutsV1");
  if ("error" in ctx) return ctx.error;
  if (!roleCanViewOfficeFinance(ctx.access.membership.role)) {
    return Response.json({ error: "Office finance visibility required" }, { status: 403 });
  }

  const payouts = await listPayouts(ctx.officeId);
  return Response.json({ payouts });
}
