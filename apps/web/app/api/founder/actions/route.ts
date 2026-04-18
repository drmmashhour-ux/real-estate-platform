import { executiveDashboardFlags, founderWorkspaceFlags } from "@/config/feature-flags";
import { brokerWorkspaceAuditKeys, logBrokerWorkspaceEvent } from "@/lib/broker/broker-workspace-audit";
import { requireExecutiveSession } from "@/modules/owner-access/owner-access.service";
import { createFounderAction, listFounderActionsForScope } from "@/modules/founder-actions/founder-action-tracker.service";
import type { CreateFounderActionInput } from "@/modules/founder-actions/founder-actions.types";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireExecutiveSession();
  if ("response" in session) return session.response;
  if (!executiveDashboardFlags.executiveCompanyMetricsV1 || !founderWorkspaceFlags.founderActionTrackingV1) {
    return Response.json({ error: "Disabled" }, { status: 403 });
  }

  const actions = await listFounderActionsForScope(session.scope, session.userId);
  return Response.json({ actions });
}

export async function POST(request: Request) {
  const session = await requireExecutiveSession();
  if ("response" in session) return session.response;
  if (!executiveDashboardFlags.executiveCompanyMetricsV1 || !founderWorkspaceFlags.founderActionTrackingV1) {
    return Response.json({ error: "Disabled" }, { status: 403 });
  }

  let body: CreateFounderActionInput;
  try {
    body = (await request.json()) as CreateFounderActionInput;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.title?.trim() || !body.summary?.trim() || !body.sourceType) {
    return Response.json({ error: "title, summary, sourceType required" }, { status: 400 });
  }

  const action = await createFounderAction(session.userId, session.scope, {
    sourceType: body.sourceType,
    sourceId: body.sourceId,
    title: body.title.trim(),
    summary: body.summary.trim(),
    priority: body.priority,
  });

  await logBrokerWorkspaceEvent({
    actorUserId: session.userId,
    actionKey: brokerWorkspaceAuditKeys.founderActionCreated,
    payload: { actionId: action.id },
  });

  return Response.json({ action });
}
