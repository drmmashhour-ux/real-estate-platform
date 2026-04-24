import { NextResponse } from "next/server";
import { requireBrokerAssistantActor } from "@/modules/broker-assistant/broker-assistant-route-guard";
import { recordBrokerAssistantAudit } from "@/modules/broker-assistant/broker-assistant-audit.service";
import { recordBrokerAssistantReview } from "@/modules/broker-assistant/broker-assistant-review.service";
import type { BrokerAssistantReviewDecision } from "@/modules/broker-assistant/broker-assistant.types";

export const dynamic = "force-dynamic";

const ALLOWED: BrokerAssistantReviewDecision[] = ["accepted", "edited", "rejected", "approved_for_signature"];

/** POST — décision de révision courtier (traçabilité; pas d’envoi automatique). */
export async function POST(req: Request) {
  const auth = await requireBrokerAssistantActor();
  if (!auth.ok) return auth.response;

  let body: { outputId?: string; decision?: string; notes?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const outputId = typeof body.outputId === "string" ? body.outputId : "";
  const decision = body.decision as BrokerAssistantReviewDecision;
  if (!outputId || !ALLOWED.includes(decision)) {
    return NextResponse.json({ error: "outputId and valid decision required" }, { status: 400 });
  }

  const row = recordBrokerAssistantReview({
    outputId,
    brokerUserId: auth.userId,
    decision,
    notes: typeof body.notes === "string" ? body.notes : undefined,
  });

  await recordBrokerAssistantAudit({
    actorUserId: auth.userId,
    action:
      decision === "rejected" ? "broker-assistant:broker_rejected_output" : "broker-assistant:broker_approved_output",
    payload: { outputId, decision, notes: row.notes },
  });

  return NextResponse.json({ record: row });
}
