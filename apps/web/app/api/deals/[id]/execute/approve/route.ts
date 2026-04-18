import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { requireDealExecutionV1 } from "@/lib/deals/pipeline-feature-guard";
import { assessApprovalReadiness, recordBrokerApproval } from "@/modules/approval/broker-approval.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireDealExecutionV1();
  if (gated) return gated;
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as { activeFormKeys?: string[]; notes?: string };
  const activeFormKeys = (body.activeFormKeys ?? ["PP", "DS"]).map((k) => k.toUpperCase());

  const readiness = await assessApprovalReadiness(dealId, activeFormKeys);
  if (!readiness.canApprove) {
    return Response.json(
      {
        error: "Approval blocked",
        blockers: readiness.blockers,
        disclaimer: "Broker must resolve validation gaps before approval — platform does not certify OACIQ compliance.",
      },
      { status: 400 },
    );
  }

  const approval = await recordBrokerApproval({
    dealId,
    approvedById: auth.userId,
    notes: body.notes,
    snapshot: { readiness, activeFormKeys },
  });

  return Response.json({
    approval,
    disclaimer: "Approval attests broker review of mapped data — not publisher execution.",
  });
}
