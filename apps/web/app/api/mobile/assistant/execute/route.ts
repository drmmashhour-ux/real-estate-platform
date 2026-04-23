import { executeAssistantAction } from "@/modules/assistant/assistant-action.service";
import type { AssistantActionType } from "@/modules/assistant/assistant.types";
import { logAssistantLearning } from "@/modules/assistant/assistant-log.service";
import { requireMobileBrokerUser } from "@/lib/mobile/require-mobile-broker";

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

/** POST /api/mobile/assistant/execute — same semantics as `/api/assistant/execute`. */
export async function POST(request: Request) {
  const auth = await requireMobileBrokerUser(request);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => ({}));
  const actionType = typeof body.actionType === "string" ? body.actionType.trim() : "";
  const actionPayload =
    typeof body.actionPayload === "object" && body.actionPayload !== null && !Array.isArray(body.actionPayload)
      ? (body.actionPayload as Record<string, unknown>)
      : {};
  const confirmed = body.confirmed === true;

  if (!ACTIONS.has(actionType)) {
    return Response.json({ success: false, message: "Invalid actionType." }, { status: 400 });
  }

  const result = await executeAssistantAction({
    brokerUserId: auth.user.id,
    brokerRole: auth.user.role,
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
    return Response.json({ success: false, message: result.message, result: null }, { status });
  }

  return Response.json({ success: true, message: result.message, result: result.result });
}
