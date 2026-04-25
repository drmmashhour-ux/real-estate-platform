import { NextRequest, NextResponse } from "next/server";
import { trackBrokerCrm } from "@/lib/broker-crm/analytics";
import { findLeadForBrokerScope } from "@/lib/broker-crm/access";
import { requireBrokerCrmApiUser } from "@/lib/broker-crm/api-auth";
import { markAutopilotActionExecutedAfterSend } from "@/lib/broker-autopilot/complete-action-after-send";
import { sendLecipmBrokerMessage } from "@/lib/messages/send-message";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Sends a broker message on the linked inquiry thread (after human review). */
export async function POST(request: NextRequest, context: Params) {
  const auth = await requireBrokerCrmApiUser();
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  const lead = await findLeadForBrokerScope(id, auth.user.id, auth.user.role);
  if (!lead?.threadId) return NextResponse.json({ error: "Not found or no thread" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const fromAiDraft = o.fromAiDraft === true;
  const autopilotActionId = typeof o.autopilotActionId === "string" ? o.autopilotActionId : null;

  const result = await sendLecipmBrokerMessage({
    threadId: lead.threadId,
    body: o.body,
    viewer: { kind: "broker", userId: auth.user.id },
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  trackBrokerCrm(
    fromAiDraft ? "broker_crm_ai_reply_sent" : "broker_crm_message_sent",
    { leadId: id, messageId: result.messageId },
    { userId: auth.user.id }
  );

  if (autopilotActionId) {
    await markAutopilotActionExecutedAfterSend({
      actionId: autopilotActionId,
      leadId: id,
      brokerUserId: auth.user.id,
      isAdmin: auth.user.role === "ADMIN",
    });
  }

  void import("@/modules/user-intelligence/integrations/crm-user-intelligence").then((m) =>
    m.recordBrokerCrmOutboundMessageSignal(auth.user.id, { leadId: id, fromAiDraft }).catch(() => {}),
  );

  void import("@/modules/growth/broker-testimonial.service").then((m) =>
    m.markBrokerTestimonialEligible(auth.user.id, "first_lead_interaction").catch(() => {}),
  );

  return NextResponse.json({ messageId: result.messageId });
}
