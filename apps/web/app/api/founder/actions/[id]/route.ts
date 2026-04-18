import { executiveDashboardFlags, founderWorkspaceFlags } from "@/config/feature-flags";
import { brokerWorkspaceAuditKeys, logBrokerWorkspaceEvent } from "@/lib/broker/broker-workspace-audit";
import { requireExecutiveSession } from "@/modules/owner-access/owner-access.service";
import { patchFounderAction } from "@/modules/founder-actions/founder-action-tracker.service";
import type { PatchFounderActionInput } from "@/modules/founder-actions/founder-actions.types";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await requireExecutiveSession();
  if ("response" in session) return session.response;
  if (!executiveDashboardFlags.executiveCompanyMetricsV1 || !founderWorkspaceFlags.founderActionTrackingV1) {
    return Response.json({ error: "Disabled" }, { status: 403 });
  }

  const { id } = await context.params;
  let patch: PatchFounderActionInput;
  try {
    patch = (await request.json()) as PatchFounderActionInput;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updated = await patchFounderAction(id, session.scope, session.userId, patch);
  if (!updated) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await logBrokerWorkspaceEvent({
    actorUserId: session.userId,
    actionKey: brokerWorkspaceAuditKeys.founderActionUpdated,
    payload: { actionId: id },
  });

  return Response.json({ action: updated });
}
