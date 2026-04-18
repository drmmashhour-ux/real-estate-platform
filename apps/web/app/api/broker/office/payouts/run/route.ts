import { brokerageOfficeFlags } from "@/config/feature-flags";
import { roleCanApproveCommissions } from "@/lib/brokerage/office-access";
import { resolveBrokerOfficeRequest } from "@/lib/brokerage/resolve-office-api";
import { createPayoutFromCommissionCases } from "@/modules/brokerage-payouts/payout.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ctx = await resolveBrokerOfficeRequest(request, "brokerPayoutsV1");
  if ("error" in ctx) return ctx.error;
  if (!roleCanApproveCommissions(ctx.access.membership.role)) {
    return Response.json({ error: "Finance approval role required" }, { status: 403 });
  }

  let body: { brokerUserId?: string; commissionCaseIds?: string[] };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.brokerUserId || !body.commissionCaseIds?.length) {
    return Response.json({ error: "brokerUserId and commissionCaseIds required" }, { status: 400 });
  }

  const result = await createPayoutFromCommissionCases({
    officeId: ctx.officeId,
    brokerUserId: body.brokerUserId,
    commissionCaseIds: body.commissionCaseIds,
    actorUserId: ctx.session.userId,
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }
  return Response.json(result);
}
