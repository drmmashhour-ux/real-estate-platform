import { executiveDashboardFlags, founderWorkspaceFlags } from "@/config/feature-flags";
import { brokerWorkspaceAuditKeys, logBrokerWorkspaceEvent } from "@/lib/broker/broker-workspace-audit";
import { requireExecutiveSession } from "@/modules/owner-access/owner-access.service";
import { runFounderCopilotWithQuestion } from "@/modules/founder-copilot/founder-copilot.service";
import type { KpiWindow } from "@/modules/broker-kpis/broker-kpis.types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await requireExecutiveSession();
  if ("response" in session) return session.response;
  if (!executiveDashboardFlags.executiveCompanyMetricsV1 || !founderWorkspaceFlags.founderAiCopilotV1) {
    return Response.json({ error: "Disabled" }, { status: 403 });
  }

  let question = "";
  let window: KpiWindow = "30d";
  let custom: { from: string; to: string } | undefined;
  try {
    const body = (await request.json()) as {
      question?: string;
      window?: KpiWindow;
      from?: string;
      to?: string;
    };
    question = (body.question ?? "").trim();
    if (body.window) window = body.window;
    if (body.from && body.to) custom = { from: body.from, to: body.to };
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!question) {
    return Response.json({ error: "question required" }, { status: 400 });
  }

  const result = await runFounderCopilotWithQuestion(session, window, question, custom);

  await logBrokerWorkspaceEvent({
    actorUserId: session.userId,
    actionKey: brokerWorkspaceAuditKeys.founderCopilotQuestion,
    payload: { window, qLen: question.length },
  });

  return Response.json({ result });
}
