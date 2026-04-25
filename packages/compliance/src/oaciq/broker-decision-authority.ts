import type { OaciqBrokerDecisionType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logOaciqComplianceTagged } from "@/lib/server/launch-logger";
import {
  OACIQ_AI_ASSIST_DISCLAIMER,
  OACIQ_BROKER_DECISION_CONFIRMATION_TEXT,
  OACIQ_BROKER_DECISION_CONFIRMATION_VERSION,
} from "@/lib/compliance/oaciq/broker-decision-constants";

export {
  OACIQ_AI_ASSIST_DISCLAIMER,
  OACIQ_BROKER_DECISION_CONFIRMATION_TEXT,
  OACIQ_BROKER_DECISION_CONFIRMATION_VERSION,
} from "@/lib/compliance/oaciq/broker-decision-constants";

const DECISION_TTL_MS = 60 * 60 * 1000;

export function brokerDecisionAuthorityEnforced(): boolean {
  return process.env.LECIPM_BROKER_DECISION_AUTHORITY_ENFORCEMENT === "1";
}

export class BrokerDecisionAuthorityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BrokerDecisionAuthorityError";
  }
}

/** Reject known automation-finalization markers on binding endpoints. */
export function assertLegallyBindingCallerNotAutomated(body: Record<string, unknown>): void {
  const src = body.lecipmDecisionSource ?? body.decisionSource;
  if (src === "ai_agent" || src === "ai_automation" || src === "unattended_automation") {
    throw new BrokerDecisionAuthorityError(
      "Automated systems cannot finalize legally binding brokerage actions. A licensed broker must confirm."
    );
  }
}

/**
 * Validates mandatory broker confirmation payload (checkbox exact text or explicit boolean).
 */
export function assertBrokerDecisionConfirmation(body: Record<string, unknown>): void {
  const ok =
    body.confirmBrokerDecision === true ||
    body.brokerDecisionConfirmation === OACIQ_BROKER_DECISION_CONFIRMATION_TEXT;
  if (!ok) {
    throw new BrokerDecisionAuthorityError(
      `Broker confirmation required: confirmBrokerDecision: true or brokerDecisionConfirmation with the exact mandated text.`
    );
  }
}

export type BrokerDecisionScope = {
  crmDealId?: string | null;
  pipelineDealId?: string | null;
  realEstateTransactionId?: string | null;
  listingId?: string | null;
  listingOfferId?: string | null;
  propertyOfferId?: string | null;
  legalDocumentArtifactId?: string | null;
  negotiationStrategyId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function recordOaciqBrokerDecision(input: {
  responsibleBrokerId: string;
  decisionType: OaciqBrokerDecisionType;
  confirmedByUserId: string;
  scope?: BrokerDecisionScope;
}): Promise<{ id: string }> {
  const meta = {
    ...(input.scope?.metadata ?? {}),
    confirmedByUserId: input.confirmedByUserId,
    responsibleBrokerId: input.responsibleBrokerId,
  };

  const row = await prisma.oaciqBrokerDecisionLog.create({
    data: {
      brokerId: input.responsibleBrokerId,
      decisionType: input.decisionType,
      confirmationTextVersion: OACIQ_BROKER_DECISION_CONFIRMATION_VERSION,
      crmDealId: input.scope?.crmDealId ?? undefined,
      pipelineDealId: input.scope?.pipelineDealId ?? undefined,
      realEstateTransactionId: input.scope?.realEstateTransactionId ?? undefined,
      listingId: input.scope?.listingId ?? undefined,
      listingOfferId: input.scope?.listingOfferId ?? undefined,
      propertyOfferId: input.scope?.propertyOfferId ?? undefined,
      legalDocumentArtifactId: input.scope?.legalDocumentArtifactId ?? undefined,
      negotiationStrategyId: input.scope?.negotiationStrategyId ?? undefined,
      metadata: meta as object,
    },
    select: { id: true },
  });

  logOaciqComplianceTagged.info("broker_decision_recorded", {
    decisionType: input.decisionType,
    responsibleBrokerId: input.responsibleBrokerId,
    confirmedByUserId: input.confirmedByUserId,
    logId: row.id,
  });

  return row;
}

export async function hasRecentBrokerDecision(params: {
  responsibleBrokerId: string;
  decisionType: OaciqBrokerDecisionType;
  realEstateTransactionId?: string | null;
  listingId?: string | null;
}): Promise<boolean> {
  const since = new Date(Date.now() - DECISION_TTL_MS);
  const whereBase = {
    brokerId: params.responsibleBrokerId,
    decisionType: params.decisionType,
    approvedAt: { gte: since } as const,
  };

  if (params.realEstateTransactionId) {
    const row = await prisma.oaciqBrokerDecisionLog.findFirst({
      where: { ...whereBase, realEstateTransactionId: params.realEstateTransactionId },
      orderBy: { approvedAt: "desc" },
      select: { id: true },
    });
    if (row) return true;
  }

  if (params.listingId) {
    const row = await prisma.oaciqBrokerDecisionLog.findFirst({
      where: { ...whereBase, listingId: params.listingId },
      orderBy: { approvedAt: "desc" },
      select: { id: true },
    });
    if (row) return true;
  }

  if (!params.realEstateTransactionId && !params.listingId) {
    const row = await prisma.oaciqBrokerDecisionLog.findFirst({
      where: whereBase,
      orderBy: { approvedAt: "desc" },
      select: { id: true },
    });
    return !!row;
  }

  return false;
}

/**
 * Before a buyer/submit path: responsible broker must have recently attested OFFER_SUBMIT for this scope.
 */
export async function assertBrokerApprovedOfferSubmission(input: {
  responsibleBrokerId: string;
  realEstateTransactionId?: string | null;
  listingId?: string | null;
}): Promise<void> {
  if (!brokerDecisionAuthorityEnforced()) return;

  if (input.realEstateTransactionId) {
    const ok = await hasRecentBrokerDecision({
      responsibleBrokerId: input.responsibleBrokerId,
      decisionType: "OFFER_SUBMIT",
      realEstateTransactionId: input.realEstateTransactionId,
    });
    if (ok) return;
  }

  if (input.listingId) {
    const ok = await hasRecentBrokerDecision({
      responsibleBrokerId: input.responsibleBrokerId,
      decisionType: "OFFER_SUBMIT",
      listingId: input.listingId,
    });
    if (ok) return;
  }

  throw new BrokerDecisionAuthorityError(
    "The responsible broker must confirm offer submission (OACIQ broker decision) before this offer can be sent. Use POST /api/compliance/oaciq/broker-decision with decisionType OFFER_SUBMIT."
  );
}

export async function assertBrokerApprovedContractSign(input: {
  responsibleBrokerId: string;
  realEstateTransactionId: string;
}): Promise<void> {
  if (!brokerDecisionAuthorityEnforced()) return;
  const ok = await hasRecentBrokerDecision({
    responsibleBrokerId: input.responsibleBrokerId,
    decisionType: "CONTRACT_SIGN",
    realEstateTransactionId: input.realEstateTransactionId,
  });
  if (!ok) {
    throw new BrokerDecisionAuthorityError(
      "The responsible broker must confirm this contract signing step before parties may sign. Use POST /api/compliance/oaciq/broker-decision with decisionType CONTRACT_SIGN."
    );
  }
}

/** Resolve listing-scoped brokerage owner for CRM listing_offers path (solo broker = ownerId). */
export async function resolveResponsibleBrokerIdForCrmListing(listingId: string): Promise<string | null> {
  const row = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { ownerId: true, tenantId: true },
  });
  if (!row?.ownerId) return null;
  return row.ownerId;
}
