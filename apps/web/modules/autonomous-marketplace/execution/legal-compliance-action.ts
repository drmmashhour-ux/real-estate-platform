import { randomUUID } from "crypto";
import type { DomainTarget, ObservationSnapshot, ProposedAction } from "../types/domain.types";
import type { LegalGateAction } from "@/modules/legal/legal-readiness.types";

/**
 * Synthetic proposed action for Legal Hub compliance policy evaluation (HTTP pre-gates).
 * Never dispatched by autonomy executors — `LEGAL_COMPLIANCE_GATE` is evaluate-only.
 */
export function buildLegalComplianceProposedAction(params: {
  gateAction: LegalGateAction;
  correlationId: string;
  target?: DomainTarget;
}): ProposedAction {
  const target: DomainTarget = params.target ?? { type: "scan", id: null };
  const id = `legal-policy-${params.gateAction}-${params.correlationId.slice(0, 24)}`;
  const now = new Date().toISOString();
  return {
    id,
    type: "LEGAL_COMPLIANCE_GATE",
    target,
    confidence: 1,
    risk: "LOW",
    title: "Legal compliance policy check",
    explanation: "Deterministic Legal Hub checklist evaluation via autonomous marketplace policy engine.",
    humanReadableSummary: `Legal compliance: ${params.gateAction}`,
    metadata: {
      legalGateAction: params.gateAction,
      purpose: "legal_compliance_precheck",
    },
    suggestedAt: now,
    sourceDetectorId: "legal_hub_policy",
    opportunityId: `legal-opp-${randomUUID()}`,
  };
}

export function buildMinimalLegalObservation(target: DomainTarget): ObservationSnapshot {
  return {
    id: `legal-obs-${randomUUID()}`,
    target,
    signals: [],
    aggregates: {},
    facts: { purpose: "legal_policy_precheck" },
    builtAt: new Date().toISOString(),
  };
}
