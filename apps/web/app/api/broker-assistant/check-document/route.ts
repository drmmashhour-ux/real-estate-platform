import { NextResponse } from "next/server";
import { buildBrokerAssistantContext } from "@/modules/broker-assistant/broker-assistant-context.service";
import { runBrokerAssistant } from "@/modules/broker-assistant/broker-assistant.engine";
import { requireBrokerAssistantActor } from "@/modules/broker-assistant/broker-assistant-route-guard";
import { recordBrokerAssistantAudit } from "@/modules/broker-assistant/broker-assistant-audit.service";
import type { BrokerAssistantContext } from "@/modules/broker-assistant/broker-assistant.types";

export const dynamic = "force-dynamic";

/** POST — même moteur, contexte orienté document / brouillon. */
export async function POST(req: Request) {
  const auth = await requireBrokerAssistantActor();
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ctx = buildBrokerAssistantContext({
    ...(body as Partial<BrokerAssistantContext>),
    currentDraftText: typeof body.currentDraftText === "string" ? body.currentDraftText : undefined,
  });

  await recordBrokerAssistantAudit({
    actorUserId: auth.userId,
    action: "broker-assistant:context_built",
    payload: { caseId: ctx.caseId, documentType: ctx.documentType },
  });

  const output = await runBrokerAssistant(ctx);
  if (output.draftingSuggestions.length) {
    await recordBrokerAssistantAudit({
      actorUserId: auth.userId,
      action: "broker-assistant:drafting_suggestion_generated",
      payload: { caseId: ctx.caseId, count: output.draftingSuggestions.length },
    });
  }

  return NextResponse.json({ output });
}
