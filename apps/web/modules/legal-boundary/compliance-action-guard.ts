import { NextResponse } from "next/server";
import type { TransactionContext } from "./transaction-context.types";
import { LECIPM_BROKER_REQUIRED_MESSAGE } from "./transaction-context.types";
import { writeLegalBoundaryAudit } from "./legal-boundary-audit.service";

export type LegalBoundaryCriticalAction =
  | "send_offer"
  | "create_offer"
  | "generate_contract"
  | "contract_field_generation"
  | "negotiation_ai"
  | "advanced_pricing_recommendation"
  | "deal_scoring_advice"
  | "investor_packet"
  | "investor_memo"
  | "closing_automation"
  | "binding_contract_execution";

const FSBO_BLOCKED: Partial<Record<LegalBoundaryCriticalAction, true>> = {
  send_offer: true,
  create_offer: true,
  generate_contract: true,
  contract_field_generation: true,
  negotiation_ai: true,
  advanced_pricing_recommendation: true,
  deal_scoring_advice: true,
  investor_packet: true,
  investor_memo: true,
  closing_automation: true,
  binding_contract_execution: true,
};

export function jsonBrokerRequiredResponse(action: LegalBoundaryCriticalAction): NextResponse {
  return NextResponse.json(
    {
      error: LECIPM_BROKER_REQUIRED_MESSAGE,
      code: "LECIPM_BROKER_REQUIRED",
      action,
    },
    { status: 403 },
  );
}

/**
 * Hard guard: blocks regulated brokerage automation in FSBO / compliance-hold states.
 */
export async function assertBrokeredTransaction(
  context: TransactionContext,
  action: LegalBoundaryCriticalAction,
  actorUserId?: string | null,
  options?: { auditAllowSuccess?: boolean },
): Promise<NextResponse | null> {
  if (context.complianceState === "BLOCKED") {
    await writeLegalBoundaryAudit({
      actionType: action,
      entityId: context.entityId,
      entityType: context.entityType,
      mode: context.mode,
      allowed: false,
      reason: "compliance_hold",
      actorUserId,
    });
    return NextResponse.json(
      { error: "This listing is on an OACIQ compliance hold.", code: "LECIPM_COMPLIANCE_HOLD" },
      { status: 403 },
    );
  }

  if (context.mode === "FSBO" && FSBO_BLOCKED[action]) {
    await writeLegalBoundaryAudit({
      actionType: action,
      entityId: context.entityId,
      entityType: context.entityType,
      mode: context.mode,
      allowed: false,
      reason: "fsbo_boundary",
      actorUserId,
    });
    return jsonBrokerRequiredResponse(action);
  }

  if (options?.auditAllowSuccess) {
    await writeLegalBoundaryAudit({
      actionType: action,
      entityId: context.entityId,
      entityType: context.entityType,
      mode: context.mode,
      allowed: true,
      reason: "brokered_or_allowed",
      actorUserId,
    });
  }

  return null;
}
