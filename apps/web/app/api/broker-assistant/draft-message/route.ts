import { NextResponse } from "next/server";
import { buildBrokerAssistantContext } from "@/modules/broker-assistant/broker-assistant-context.service";
import { requireBrokerAssistantActor } from "@/modules/broker-assistant/broker-assistant-route-guard";
import { recordBrokerAssistantAudit } from "@/modules/broker-assistant/broker-assistant-audit.service";
import { translateBrokerMessageEnToProfessionalFr } from "@/modules/broker-assistant/broker-assistant-translation.service";

export const dynamic = "force-dynamic";

/** POST — EN → FR professionnel (révision courtier obligatoire). */
export async function POST(req: Request) {
  const auth = await requireBrokerAssistantActor();
  if (!auth.ok) return auth.response;

  let body: { textEn?: string; context?: Record<string, unknown> };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const textEn = typeof body.textEn === "string" ? body.textEn : "";
  if (!textEn.trim()) {
    return NextResponse.json({ error: "textEn required" }, { status: 400 });
  }

  const ctx = buildBrokerAssistantContext({
    ...(body.context ?? {}),
    documentType: "email",
  });

  const translation = translateBrokerMessageEnToProfessionalFr(textEn, ctx);
  await recordBrokerAssistantAudit({
    actorUserId: auth.userId,
    action: "broker-assistant:translation_generated",
    payload: { caseId: ctx.caseId, length: textEn.length },
  });

  return NextResponse.json({
    status: "READY_FOR_REVIEW" as const,
    translation,
    disclaimersFr: [
      "Ne pas envoyer sans validation du courtier.",
      "Vérifier les faits, les échéances et le ton professionnel.",
    ],
  });
}
