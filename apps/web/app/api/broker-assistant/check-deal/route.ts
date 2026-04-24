import { NextResponse } from "next/server";
import { buildBrokerAssistantContext } from "@/modules/broker-assistant/broker-assistant-context.service";
import { runBrokerAssistant } from "@/modules/broker-assistant/broker-assistant.engine";
import { requireBrokerAssistantActor } from "@/modules/broker-assistant/broker-assistant-route-guard";
import { recordBrokerAssistantAudit } from "@/modules/broker-assistant/broker-assistant-audit.service";
import type { BrokerAssistantContext } from "@/modules/broker-assistant/broker-assistant.types";

export const dynamic = "force-dynamic";

/** POST — analyse résidentielle pour un dossier (contexte JSON). */
export async function POST(req: Request) {
  const auth = await requireBrokerAssistantActor();
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ctx = buildBrokerAssistantContext(body as Partial<BrokerAssistantContext>);
  await recordBrokerAssistantAudit({
    actorUserId: auth.userId,
    action: "broker-assistant:context_built",
    payload: { caseId: ctx.caseId, dealId: ctx.dealId },
  });

  const output = await runBrokerAssistant(ctx, {
    includeDrafting: body.includeDrafting !== false,
    includeClauses: body.includeClauses !== false,
  });

  if (output.missingInformation.length) {
    await recordBrokerAssistantAudit({
      actorUserId: auth.userId,
      action: "broker-assistant:missing_info_detected",
      payload: { caseId: ctx.caseId, ids: output.missingInformation.map((m) => m.id) },
    });
  }
  if (output.complianceFlags.length) {
    await recordBrokerAssistantAudit({
      actorUserId: auth.userId,
      action: "broker-assistant:compliance_flag_raised",
      payload: {
        caseId: ctx.caseId,
        codes: output.complianceFlags.map((f) => f.code),
        levels: output.complianceFlags.map((f) => f.level),
      },
    });
  }

  return NextResponse.json({ output });
}
