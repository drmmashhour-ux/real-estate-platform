import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { requireNegotiationCopilotV1 } from "@/lib/deals/payments-negotiation-feature-guard";
import { updateNegotiationStrategyBroker } from "@/modules/deal/negotiation-strategy.service";
import {
  assertBrokerDecisionConfirmation,
  assertLegallyBindingCallerNotAutomated,
  brokerDecisionAuthorityEnforced,
  recordOaciqBrokerDecision,
} from "@/lib/compliance/oaciq/broker-decision-authority";

export const dynamic = "force-dynamic";

const NEGOTIATION_AI_DISCLAIMER =
  "Approval marks broker intent to prepare/send through your official workflow — the platform does not transmit counter-offers automatically.";

/**
 * PATCH — broker selects, modifies notes/price/conditions, or marks approved-to-send (manual dispatch only).
 */
export async function PATCH(request: Request, context: { params: Promise<{ id: string; strategyId: string }> }) {
  const gated = requireNegotiationCopilotV1();
  if (gated) return gated;

  const { id: dealId, strategyId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const workflowStatus = body.workflowStatus;
  if (
    workflowStatus !== "BROKER_SELECTED" &&
    workflowStatus !== "BROKER_APPROVED_TO_SEND" &&
    workflowStatus !== "DISMISSED" &&
    workflowStatus !== "AI_PROPOSED"
  ) {
    return Response.json({ error: "Invalid workflowStatus" }, { status: 400 });
  }

  try {
    if (
      brokerDecisionAuthorityEnforced() &&
      (workflowStatus === "BROKER_SELECTED" || workflowStatus === "BROKER_APPROVED_TO_SEND")
    ) {
      assertLegallyBindingCallerNotAutomated(body);
      assertBrokerDecisionConfirmation(body);
    }

    const row = await updateNegotiationStrategyBroker({
      dealId,
      strategyId,
      workflowStatus,
      brokerNotes: typeof body.brokerNotes === "string" ? body.brokerNotes : undefined,
      suggestedPrice: typeof body.suggestedPrice === "number" ? body.suggestedPrice : undefined,
      conditionChangesJson: body.conditionChangesJson,
    });

    if (
      brokerDecisionAuthorityEnforced() &&
      (workflowStatus === "BROKER_SELECTED" || workflowStatus === "BROKER_APPROVED_TO_SEND")
    ) {
      const responsibleBrokerId = auth.deal.brokerId ?? auth.userId;
      await recordOaciqBrokerDecision({
        responsibleBrokerId,
        decisionType: "NEGOTIATION_STEP",
        confirmedByUserId: auth.userId,
        scope: {
          crmDealId: dealId,
          negotiationStrategyId: strategyId,
          metadata: { workflowStatus },
        },
      });
    }

    return Response.json({ ok: true, disclaimer: NEGOTIATION_AI_DISCLAIMER, strategy: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed";
    return Response.json({ error: msg }, { status: 400 });
  }
}
