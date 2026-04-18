import { brokerOpsFlags } from "@/config/feature-flags";
import { requireBrokerResidentialSession } from "@/lib/broker/residential-access";
import { brokerWorkspaceAuditKeys, logBrokerWorkspaceEvent } from "@/lib/broker/broker-workspace-audit";
import { assertBrokerResidentialFsboListing } from "@/lib/broker/residential-fsbo-scope";
import { updateDraftStatus } from "@/modules/marketing-drafts/marketing-draft.service";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, ctx: { params: Promise<{ id: string; draftId: string }> }) {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;
  if (!brokerOpsFlags.residentialMarketingAutopilotV1) {
    return Response.json({ error: "Marketing autopilot disabled" }, { status: 403 });
  }

  const { id, draftId } = await ctx.params;
  const listing = await assertBrokerResidentialFsboListing({
    brokerId: session.userId,
    listingId: id,
    role: session.role,
  });
  if (!listing) return Response.json({ error: "Listing not found" }, { status: 404 });

  const ok = await updateDraftStatus({
    draftId,
    listingId: id,
    brokerId: session.userId,
    status: "scheduled",
  });
  if (!ok) return Response.json({ error: "Draft not found" }, { status: 404 });

  await logBrokerWorkspaceEvent({
    actorUserId: session.userId,
    actionKey: brokerWorkspaceAuditKeys.marketingDraftScheduled,
    payload: { listingId: id, draftId },
  });

  return Response.json({ ok: true });
}
