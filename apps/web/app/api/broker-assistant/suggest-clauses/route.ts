import { NextResponse } from "next/server";
import { buildBrokerAssistantContext } from "@/modules/broker-assistant/broker-assistant-context.service";
import { suggestClauseCategoriesForContext } from "@/modules/broker-assistant/broker-assistant-clauses.service";
import { requireBrokerAssistantActor } from "@/modules/broker-assistant/broker-assistant-route-guard";
import { recordBrokerAssistantAudit } from "@/modules/broker-assistant/broker-assistant-audit.service";
import type { BrokerAssistantContext } from "@/modules/broker-assistant/broker-assistant.types";

export const dynamic = "force-dynamic";

/** POST — suggestions de catégories de clauses (non finalisées). */
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
  const suggestedClauses = await suggestClauseCategoriesForContext(ctx);

  await recordBrokerAssistantAudit({
    actorUserId: auth.userId,
    action: "broker-assistant:clause_suggestion_generated",
    payload: { caseId: ctx.caseId, count: suggestedClauses.length },
  });

  return NextResponse.json({ status: "READY_FOR_REVIEW" as const, suggestedClauses });
}
