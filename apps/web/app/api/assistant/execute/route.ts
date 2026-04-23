import { NextResponse } from "next/server";

import { executeAssistantAction } from "@/modules/assistant/assistant-action.service";
import type { AssistantActionType } from "@/modules/assistant/assistant.types";
import { logAssistantLearning } from "@/modules/assistant/assistant-log.service";
import { requireBrokerOrAdminApi } from "@/modules/crm/services/require-broker-api";

export const dynamic = "force-dynamic";

const ACTIONS = new Set<string>([
  "SEND_FOLLOWUP",
  "SCHEDULE_VISIT",
  "RESCHEDULE_VISIT",
  "ESCALATE_TO_ADMIN",
  "ASSIGN_BROKER",
  "SEND_SIMILAR_LISTINGS",
  "REQUEST_OFFER_UPDATE",
]);

/**
 * POST /api/assistant/execute — broker-confirmed assistant actions (logged).
 */
export async function POST(request: Request) {
  const gate = await requireBrokerOrAdminApi();
  if (!gate.ok) return gate.response;

  const body = await request.json().catch(() => ({}));
  const actionType = typeof body.actionType === "string" ? body.actionType.trim() : "";
  const actionPayload =
    typeof body.actionPayload === "object" && body.actionPayload !== null && !Array.isArray(body.actionPayload)
      ? (body.actionPayload as Record<string, unknown>)
      : {};
  const confirmed = body.confirmed === true;

  if (!ACTIONS.has(actionType)) {
    return NextResponse.json({ success: false, message: "Invalid actionType." }, { status: 400 });
  }

  const result = await executeAssistantAction({
    brokerUserId: gate.session.id,
    brokerRole: gate.session.role,
    actionType: actionType as AssistantActionType,
    actionPayload,
    confirmed,
  });

  logAssistantLearning({
    actionType: actionType as AssistantActionType,
    accepted: true,
    leadId: typeof actionPayload.leadId === "string" ? actionPayload.leadId : undefined,
  });

  if (!result.success) {
    const status =
      result.code === "FORBIDDEN" ? 403 : result.code === "CONFIRM" ? 400 : result.code === "MODE" ? 403 : 400;
    return NextResponse.json({ success: false, message: result.message, result: null }, { status });
  }

  return NextResponse.json({
    success: true,
    message: result.message,
    result: result.result,
  });
}
