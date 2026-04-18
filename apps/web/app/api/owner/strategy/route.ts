import { executiveDashboardFlags } from "@/config/feature-flags";
import { brokerWorkspaceAuditKeys, logBrokerWorkspaceEvent } from "@/lib/broker/broker-workspace-audit";
import { requireExecutiveSession } from "@/modules/owner-access/owner-access.service";
import { buildStrategyBoardPayload } from "@/modules/strategy-board/strategy-board.service";
import type { KpiWindow } from "@/modules/broker-kpis/broker-kpis.types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireExecutiveSession();
  if ("response" in session) return session.response;
  if (!executiveDashboardFlags.companyStrategyBoardV1 || !executiveDashboardFlags.executiveCompanyMetricsV1) {
    return Response.json({ error: "Strategy board disabled" }, { status: 403 });
  }

  const url = new URL(request.url);
  const window = (url.searchParams.get("window") ?? "30d") as KpiWindow;
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const custom = from && to ? { from, to } : undefined;

  const board = await buildStrategyBoardPayload(session.scope, window, custom);

  await logBrokerWorkspaceEvent({
    actorUserId: session.userId,
    actionKey: brokerWorkspaceAuditKeys.ownerStrategyBoardViewed,
    payload: { insightCount: board.insights.length },
  });

  return Response.json({ strategy: board });
}
