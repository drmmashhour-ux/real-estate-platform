import { executiveDashboardFlags, founderWorkspaceFlags } from "@/config/feature-flags";
import { brokerWorkspaceAuditKeys, logBrokerWorkspaceEvent } from "@/lib/broker/broker-workspace-audit";
import { requireExecutiveSession } from "@/modules/owner-access/owner-access.service";
import { getFounderCopilotPayload } from "@/modules/founder-copilot/founder-copilot.service";
import type { KpiWindow } from "@/modules/broker-kpis/broker-kpis.types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await requireExecutiveSession();
  if ("response" in session) return session.response;
  if (!executiveDashboardFlags.executiveCompanyMetricsV1 || !founderWorkspaceFlags.founderAiCopilotV1) {
    return Response.json({ error: "Disabled" }, { status: 403 });
  }

  let window: KpiWindow = "30d";
  let custom: { from: string; to: string } | undefined;
  try {
    const body = (await request.json()) as { window?: KpiWindow; from?: string; to?: string };
    if (body.window) window = body.window;
    if (body.from && body.to) custom = { from: body.from, to: body.to };
  } catch {
    /* empty */
  }

  const copilot = await getFounderCopilotPayload(session, window, custom);

  await logBrokerWorkspaceEvent({
    actorUserId: session.userId,
    actionKey: brokerWorkspaceAuditKeys.founderCopilotRun,
    payload: { window },
  });

  return Response.json({ copilot });
}
