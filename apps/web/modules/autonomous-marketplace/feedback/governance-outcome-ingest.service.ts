/**
 * Normalize external events into ground-truth rows for feedback — pure, never throws.
 */
import type { GovernanceGroundTruthEvent } from "./governance-feedback.types";

function isoNow(): string {
  try {
    return new Date().toISOString();
  } catch {
    return "1970-01-01T00:00:00.000Z";
  }
}

export function normalizeRefundOutcomeEvent(raw: {
  amount?: number;
  occurredAt?: string;
  metadata?: Record<string, unknown>;
}): GovernanceGroundTruthEvent[] {
  try {
    return [
      {
        type: "refund",
        occurredAt: typeof raw.occurredAt === "string" ? raw.occurredAt : isoNow(),
        amount: typeof raw.amount === "number" ? raw.amount : undefined,
        metadata: raw.metadata,
      },
    ];
  } catch {
    return [];
  }
}

export function normalizeChargebackOutcomeEvent(raw: {
  amount?: number;
  occurredAt?: string;
  metadata?: Record<string, unknown>;
}): GovernanceGroundTruthEvent[] {
  try {
    return [
      {
        type: "chargeback",
        occurredAt: typeof raw.occurredAt === "string" ? raw.occurredAt : isoNow(),
        amount: typeof raw.amount === "number" ? raw.amount : undefined,
        metadata: raw.metadata,
      },
    ];
  } catch {
    return [];
  }
}

export function normalizeApprovalOutcomeEvent(raw: {
  granted?: boolean;
  occurredAt?: string;
  metadata?: Record<string, unknown>;
}): GovernanceGroundTruthEvent[] {
  try {
    const granted = raw.granted === true;
    return [
      {
        type: granted ? "manual_approval_granted" : "manual_approval_rejected",
        occurredAt: typeof raw.occurredAt === "string" ? raw.occurredAt : isoNow(),
        metadata: raw.metadata,
      },
    ];
  } catch {
    return [];
  }
}

export function normalizeExecutionOutcomeEvent(raw: {
  succeeded?: boolean;
  occurredAt?: string;
  metadata?: Record<string, unknown>;
}): GovernanceGroundTruthEvent[] {
  try {
    const succeeded = raw.succeeded === true;
    return [
      {
        type: succeeded ? "execution_succeeded" : "execution_failed",
        occurredAt: typeof raw.occurredAt === "string" ? raw.occurredAt : isoNow(),
        metadata: raw.metadata,
      },
    ];
  } catch {
    return [];
  }
}

export function normalizeTrustEscalationEvent(raw: {
  opened?: boolean;
  occurredAt?: string;
  metadata?: Record<string, unknown>;
}): GovernanceGroundTruthEvent[] {
  try {
    const opened = raw.opened !== false;
    return [
      {
        type: opened ? "trust_escalation_opened" : "trust_escalation_closed",
        occurredAt: typeof raw.occurredAt === "string" ? raw.occurredAt : isoNow(),
        metadata: raw.metadata,
      },
    ];
  } catch {
    return [];
  }
}
