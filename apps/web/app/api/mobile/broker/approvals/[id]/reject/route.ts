import { requireMobileBrokerUser } from "@/lib/mobile/require-mobile-broker";
import { brokerMobileFlags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import { logGrowthEngineAudit } from "@/modules/growth-engine-audit/growth-engine-audit.service";

export const dynamic = "force-dynamic";

/** Reject communication draft only in v1 (`id` = draft UUID). */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireMobileBrokerUser(request);
  if (!auth.ok) return auth.response;
  if (!brokerMobileFlags.mobileQuickApprovalsV1) {
    return Response.json({ error: "Mobile quick approvals disabled" }, { status: 403 });
  }

  const { id: draftId } = await ctx.params;

  const draft = await prisma.lecipmCommunicationDraft.findFirst({
    where: { id: draftId, brokerId: auth.user.id, status: "pending_approval" },
  });
  if (!draft) {
    return Response.json({ error: "Draft not found" }, { status: 404 });
  }

  await prisma.lecipmCommunicationDraft.update({
    where: { id: draftId },
    data: { status: "rejected" },
  });

  await logGrowthEngineAudit({
    actorUserId: auth.user.id,
    action: "mobile_broker_approval_rejected",
    payload: { draftId },
  });

  return Response.json({ ok: true });
}
