import { brokerageOfficeFlags } from "@/config/feature-flags";
import { roleCanApproveCommissions } from "@/lib/brokerage/office-access";
import { resolveBrokerOfficeRequest } from "@/lib/brokerage/resolve-office-api";
import { disputeCommissionCase } from "@/modules/commission-engine/commission-dispute.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, p: { params: Promise<{ id: string }> }) {
  const ctx = await resolveBrokerOfficeRequest(request, "commissionEngineV1");
  if ("error" in ctx) return ctx.error;
  if (!roleCanApproveCommissions(ctx.access.membership.role)) {
    return Response.json({ error: "Finance approval role required" }, { status: 403 });
  }
  if (!brokerageOfficeFlags.commissionEngineV1) {
    return Response.json({ error: "Disabled" }, { status: 403 });
  }

  const { id } = await p.params;
  let note: string | undefined;
  try {
    const body = (await request.json()) as { note?: string };
    note = body.note;
  } catch {
    note = undefined;
  }

  const row = await disputeCommissionCase({
    caseId: id,
    officeId: ctx.officeId,
    actorUserId: ctx.session.userId,
    note,
  });
  return Response.json({ commissionCase: row });
}
