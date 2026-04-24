import { NextResponse } from "next/server";
import { buildBrokerAssistantContext } from "@/modules/broker-assistant/broker-assistant-context.service";
import { detectMissingInformation } from "@/modules/broker-assistant/broker-assistant-checklist.service";
import { evaluateBrokerAssistantCompliance } from "@/modules/broker-assistant/broker-assistant-compliance.service";
import { requireBrokerAssistantActor } from "@/modules/broker-assistant/broker-assistant-route-guard";
import { recordBrokerAssistantAudit } from "@/modules/broker-assistant/broker-assistant-audit.service";
import type { BrokerAssistantContext } from "@/modules/broker-assistant/broker-assistant.types";

export const dynamic = "force-dynamic";

/** POST — couche conformité seule (rapide). */
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
  const missing = detectMissingInformation(ctx);
  const { level, flags } = evaluateBrokerAssistantCompliance(ctx, missing);

  if (flags.length) {
    await recordBrokerAssistantAudit({
      actorUserId: auth.userId,
      action: "broker-assistant:compliance_flag_raised",
      payload: { caseId: ctx.caseId, codes: flags.map((f) => f.code) },
    });
  }

  return NextResponse.json({ complianceLevel: level, complianceFlags: flags, missingInformation: missing });
}
