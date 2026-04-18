import { requireMobileBrokerUser } from "@/lib/mobile/require-mobile-broker";
import { assertQuickApprovalEnabled } from "@/modules/mobile-approvals/safe-action-gate.service";
import { brokerMobileFlags } from "@/config/feature-flags";
import { completeMobileBrokerAction } from "@/modules/mobile-approvals/mobile-approval.service";
import { trackMobileApprovalCompleted } from "@/lib/analytics/mobile-broker-analytics";
import { logGrowthEngineAudit } from "@/modules/growth-engine-audit/growth-engine-audit.service";

export const dynamic = "force-dynamic";

/** `id` is `dac:...` action id (URL-encoded). */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireMobileBrokerUser(request);
  if (!auth.ok) return auth.response;
  if (!brokerMobileFlags.mobileQuickApprovalsV1) {
    return Response.json({ error: "Mobile quick approvals disabled" }, { status: 403 });
  }
  const gate = assertQuickApprovalEnabled({ mobileQuickApprovals: brokerMobileFlags.mobileQuickApprovalsV1 });
  if (gate) return gate;

  const { id: raw } = await ctx.params;
  const actionId = decodeURIComponent(raw);

  const result = await completeMobileBrokerAction({
    brokerUserId: auth.user.id,
    isAdmin: auth.isAdmin,
    actionId,
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  trackMobileApprovalCompleted({ kind: result.kind, entityId: result.entityId });
  await logGrowthEngineAudit({
    actorUserId: auth.user.id,
    action: "mobile_broker_approval_completed",
    payload: { actionId, kind: result.kind },
  });

  return Response.json({ kind: "mobile_broker_approval_v1", result });
}
