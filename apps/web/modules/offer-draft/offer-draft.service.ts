import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { asInputJsonValue } from "@/lib/prisma/as-input-json";
import { assertOfferSendSignatureGate } from "@/lib/signature-control/action-pipeline-guard";
import { assessBrokerApprovalRisk } from "@/modules/broker-action-risk/risk.engine";
import type { SignatureProviderId } from "@/modules/signature/signature.types";
import {
  dispatchLegalDocumentArtifact,
  generateLegalDocumentArtifact,
  legalDocumentsEngineEnabled,
} from "@/modules/legal-documents";
import { generateOfferDraft } from "./auto-offer-generator.engine";
import { recordOfferDraftAudit } from "./offer-draft-audit.service";

export async function getLatestOfferDraftForDeal(dealId: string) {
  return prisma.offerDraft.findFirst({
    where: { dealId },
    orderBy: { createdAt: "desc" },
  });
}

export async function generateOfferDraftRecord(input: {
  dealId: string;
  actorBrokerUserId: string;
}) {
  const gen = await generateOfferDraft(input.dealId);
  const dealRow = await prisma.deal.findUnique({
    where: { id: input.dealId },
    select: { listingId: true, buyerId: true },
  });
  if (!dealRow) throw new Error("DEAL_NOT_FOUND");

  const draft = await prisma.offerDraft.create({
    data: {
      dealId: input.dealId,
      listingId: dealRow.listingId,
      buyerId: dealRow.buyerId,
      generatedBy: "AI",
      status: "READY_FOR_REVIEW",
      purchasePrice: gen.purchasePrice,
      depositAmount: gen.depositAmount,
      financingDeadline: gen.financingDeadline,
      inspectionDeadline: gen.inspectionDeadline,
      occupancyDate: gen.occupancyDate,
      includedItemsJson: asInputJsonValue(gen.includedItemsJson),
      excludedItemsJson: asInputJsonValue(gen.excludedItemsJson),
      specialConditionsJson: asInputJsonValue(gen.specialConditionsJson),
      rationaleJson: asInputJsonValue(gen.rationaleJson),
      priceBandsJson: asInputJsonValue(gen.priceBandsJson),
      clauseWarningsJson: asInputJsonValue(gen.clauseWarningsJson),
      financingClauseText: gen.financingClauseText,
      inspectionClauseText: gen.inspectionClauseText,
      occupancyClauseText: gen.occupancyClauseText,
    },
  });

  await recordOfferDraftAudit({
    dealId: input.dealId,
    offerDraftId: draft.id,
    actorUserId: input.actorBrokerUserId,
    action: "draft_generated",
    metadata: { purchasePrice: draft.purchasePrice, selectedBand: "BALANCED" },
  });

  return draft;
}

export async function updateOfferDraftFields(input: {
  dealId: string;
  draftId: string;
  actorBrokerUserId: string;
  patch: Partial<{
    purchasePrice: number;
    depositAmount: number | null;
    financingDeadline: string | null;
    inspectionDeadline: string | null;
    occupancyDate: string | null;
    includedItemsJson: unknown;
    excludedItemsJson: unknown;
    specialConditionsJson: unknown;
    financingClauseText: string | null;
    inspectionClauseText: string | null;
    occupancyClauseText: string | null;
  }>;
}) {
  const existing = await prisma.offerDraft.findFirst({
    where: { id: input.draftId, dealId: input.dealId },
  });
  if (!existing) throw new Error("DRAFT_NOT_FOUND");
  if (existing.status === "SENT") throw new Error("DRAFT_IMMUTABLE");

  const data: Record<string, unknown> = {};
  if (input.patch.purchasePrice != null) data.purchasePrice = input.patch.purchasePrice;
  if (input.patch.depositAmount !== undefined) data.depositAmount = input.patch.depositAmount;
  if (input.patch.financingDeadline !== undefined) {
    data.financingDeadline = input.patch.financingDeadline ? new Date(input.patch.financingDeadline) : null;
  }
  if (input.patch.inspectionDeadline !== undefined) {
    data.inspectionDeadline = input.patch.inspectionDeadline ? new Date(input.patch.inspectionDeadline) : null;
  }
  if (input.patch.occupancyDate !== undefined) {
    data.occupancyDate = input.patch.occupancyDate ? new Date(input.patch.occupancyDate) : null;
  }
  if (input.patch.includedItemsJson !== undefined) data.includedItemsJson = asInputJsonValue(input.patch.includedItemsJson);
  if (input.patch.excludedItemsJson !== undefined) data.excludedItemsJson = asInputJsonValue(input.patch.excludedItemsJson);
  if (input.patch.specialConditionsJson !== undefined) {
    data.specialConditionsJson = asInputJsonValue(input.patch.specialConditionsJson);
  }
  if (input.patch.financingClauseText !== undefined) data.financingClauseText = input.patch.financingClauseText;
  if (input.patch.inspectionClauseText !== undefined) data.inspectionClauseText = input.patch.inspectionClauseText;
  if (input.patch.occupancyClauseText !== undefined) data.occupancyClauseText = input.patch.occupancyClauseText;

  const updated = await prisma.offerDraft.update({
    where: { id: existing.id },
    data: data as Parameters<typeof prisma.offerDraft.update>[0]["data"],
  });

  await recordOfferDraftAudit({
    dealId: input.dealId,
    offerDraftId: updated.id,
    actorUserId: input.actorBrokerUserId,
    action: "field_modified_by_broker",
    metadata: { keys: Object.keys(input.patch) },
  });

  return updated;
}

export async function approveOfferDraft(input: {
  dealId: string;
  draftId: string;
  brokerUserId: string;
  role: PlatformRole;
  brokerConfirmed: boolean;
  /** ADMIN only — must accompany explicit compliance acknowledgement when blockers exist. */
  riskOverrideAcknowledged?: boolean;
}) {
  if (!input.brokerConfirmed) throw new Error("BROKER_CONFIRMATION_REQUIRED");

  const risk = await assessBrokerApprovalRisk({
    kind: "offer_draft_approve",
    dealId: input.dealId,
    draftId: input.draftId,
  });
  if (risk.blockers.length > 0) {
    const mayOverride = input.role === "ADMIN" && input.riskOverrideAcknowledged === true;
    if (!mayOverride) throw new Error("APPROVAL_RISK_BLOCKED");
  }

  const draft = await prisma.offerDraft.findFirst({
    where: { id: input.draftId, dealId: input.dealId },
  });
  if (!draft) throw new Error("DRAFT_NOT_FOUND");
  if (draft.status === "SENT") throw new Error("DRAFT_IMMUTABLE");
  if (draft.status === "APPROVED" && draft.promiseArtifactId) {
    return draft;
  }

  const snapshot = {
    purchasePrice: draft.purchasePrice,
    depositAmount: draft.depositAmount,
    financingDeadline: draft.financingDeadline?.toISOString() ?? null,
    inspectionDeadline: draft.inspectionDeadline?.toISOString() ?? null,
    occupancyDate: draft.occupancyDate?.toISOString() ?? null,
    includedItemsJson: draft.includedItemsJson,
    excludedItemsJson: draft.excludedItemsJson,
    specialConditionsJson: draft.specialConditionsJson,
    rationaleJson: draft.rationaleJson,
    financingClauseText: draft.financingClauseText,
    inspectionClauseText: draft.inspectionClauseText,
    occupancyClauseText: draft.occupancyClauseText,
  };

  let promiseArtifactId: string | null = draft.promiseArtifactId;
  if (!promiseArtifactId) {
    if (!legalDocumentsEngineEnabled()) {
      throw new Error("LEGAL_DOCUMENTS_ENGINE_DISABLED");
    }
    const art = await generateLegalDocumentArtifact({
      kind: "PROMISE_TO_PURCHASE",
      dealId: input.dealId,
      userId: input.brokerUserId,
      role: input.role,
    });
    promiseArtifactId = art.id;
  }

  const updated = await prisma.offerDraft.update({
    where: { id: draft.id },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      approvedByBrokerId: input.brokerUserId,
      promiseArtifactId,
      offerSnapshotJson: asInputJsonValue(snapshot),
    },
  });

  await recordOfferDraftAudit({
    dealId: input.dealId,
    offerDraftId: updated.id,
    actorUserId: input.brokerUserId,
    action: "draft_approved",
    metadata: { promiseArtifactId },
  });

  return updated;
}

export async function sendApprovedOfferDraft(input: {
  dealId: string;
  draftId: string;
  brokerUserId: string;
  role: PlatformRole;
  channel: "EMAIL" | "ESIGN_ENVELOPE";
  esign?: { provider: SignatureProviderId; participants: { name: string; role: string; email?: string | null }[] };
  /** When set (or when SIGNATURE_CONTROL_REQUIRE_EXECUTED_PIPELINE_FOR_OFFER_SEND=1), must reference an EXECUTED AI ActionPipeline for this deal. */
  autopilotActionPipelineId?: string | null;
}) {
  await assertOfferSendSignatureGate({
    dealId: input.dealId,
    autopilotActionPipelineId: input.autopilotActionPipelineId ?? null,
  });

  const draft = await prisma.offerDraft.findFirst({
    where: { id: input.draftId, dealId: input.dealId },
  });
  if (!draft) throw new Error("DRAFT_NOT_FOUND");
  if (draft.status !== "APPROVED") throw new Error("DRAFT_NOT_APPROVED");
  if (!draft.promiseArtifactId) throw new Error("PROMISE_ARTIFACT_MISSING");
  if (draft.status === "SENT") throw new Error("ALREADY_SENT");

  const artifact = await prisma.lecipmLegalDocumentArtifact.findUnique({
    where: { id: draft.promiseArtifactId },
  });
  if (!artifact) throw new Error("ARTIFACT_NOT_FOUND");
  if (artifact.status !== "APPROVED") {
    throw new Error("PROMISE_ARTIFACT_NOT_APPROVED");
  }

  if (!legalDocumentsEngineEnabled()) {
    throw new Error("LEGAL_DOCUMENTS_ENGINE_DISABLED");
  }

  if (input.channel === "ESIGN_ENVELOPE") {
    if (!input.esign?.participants?.length) throw new Error("ESIGN_PARTICIPANTS_REQUIRED");
    await dispatchLegalDocumentArtifact({
      artifactId: draft.promiseArtifactId,
      userId: input.brokerUserId,
      role: input.role,
      channel: "ESIGN_ENVELOPE",
      esign: { provider: input.esign.provider, participants: input.esign.participants },
    });
  } else {
    await dispatchLegalDocumentArtifact({
      artifactId: draft.promiseArtifactId,
      userId: input.brokerUserId,
      role: input.role,
      channel: "EMAIL",
    });
  }

  const sent = await prisma.offerDraft.update({
    where: { id: draft.id },
    data: {
      status: "SENT",
      sentAt: new Date(),
      sentByBrokerId: input.brokerUserId,
    },
  });

  await recordOfferDraftAudit({
    dealId: input.dealId,
    offerDraftId: sent.id,
    actorUserId: input.brokerUserId,
    action: "offer_sent",
    metadata: {
      channel: input.channel,
      artifactId: draft.promiseArtifactId,
      autopilotActionPipelineId: input.autopilotActionPipelineId?.trim() || null,
    },
  });

  return sent;
}
