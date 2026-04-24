import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { z } from "zod";
import { generateDraft } from "@/lib/ai/generate-draft";
import { validateDraft, checkConsistency } from "@/lib/compliance/draft-validation";
import { enforceAction } from "@/lib/compliance/enforce-action";
import { enforceFormOrder, assertFormOrderStepAccess, type FormOrderInput } from "@/lib/compliance/form-order";
import { validateDS, withDSReference, type SellerDeclarationInput } from "@/lib/compliance/seller-declaration";
import {
  assertSignatureReleaseRules,
  computeSignatureRecordHash,
  type SignaturePayload,
} from "@/lib/compliance/signature";
import { ensureContractRegistryNumber } from "@/lib/compliance/contract-registry";
import { runInspection } from "@/lib/compliance/inspection";
import { canReleaseTransaction } from "@/lib/compliance/release";
import { requireUser } from "@/lib/auth/require-user";
import { requireActiveResidentialBrokerLicence } from "@/lib/compliance/oaciq/broker-licence-guard";
import { prisma } from "@/lib/db";
import { logError } from "@/lib/logger";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";
import { logAuditEvent } from "@/lib/compliance/log-audit-event";
import { rejectIfInspectionReadOnlyMutation } from "@/lib/compliance/inspection-session-guard";
import { assertBrokeredTransaction } from "@/modules/legal-boundary/compliance-action-guard";
import { writeSignatureBoundaryAudit } from "@/modules/legal-boundary/legal-boundary-audit.service";
import { getOrSyncTransactionContext } from "@/modules/legal-boundary/transaction-context.service";

export const dynamic = "force-dynamic";

const formOrderSchema = z.object({
  identityVerified: z.boolean(),
  brokerageContractSigned: z.boolean(),
  sellerDeclarationCompleted: z.boolean(),
  promiseToPurchaseSigned: z.boolean(),
  finalReviewCompleted: z.boolean(),
  signatureCompleted: z.boolean(),
  transactionType: z.enum(["sale", "purchase", "lease"]),
});

const dsSchema = z.object({
  listingId: z.string().optional().nullable(),
  contractId: z.string().optional().nullable(),
  referenceNumber: z.string().optional().nullable(),
});

const signatureSchema = z.object({
  signerId: z.string().min(1),
  signerType: z.enum(["broker", "client"]),
  signedDate: z.string().min(1),
  signedTime: z.string().min(1),
  signedCity: z.string().min(1),
  signedAt: z.string().optional(),
});

const bodySchema = z.object({
  formType: z.string().min(1),
  facts: z.record(z.unknown()).optional().default({}),
  listing: z.object({ address: z.string().optional().nullable() }).optional(),
  formOrder: formOrderSchema,
  ds: dsSchema,
  signature: signatureSchema,
  hash: z.string().min(1),
  aiGenerated: z.boolean().optional(),
  brokerReviewed: z.boolean().optional(),
  entityType: z.string().min(1).optional(),
  entityId: z.string().min(1).optional(),
  signatureMethod: z.enum(["drawn", "typed", "uploaded"]).optional().default("typed"),
  persistAuditTrail: z.boolean().optional().default(true),
  /** Re-use a number already issued in `contract_registry` for this deal/session. */
  contractNumber: z.string().min(1).optional(),
});

function factString(facts: Record<string, unknown>, key: string): string | undefined {
  const v = facts[key];
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function mapDraftError(message: string): string {
  if (message === "DRAFT_INVALID") return "VALIDATION_FAILED";
  if (message === "CONTRADICTION_DETECTED") return "CONFLICT_DETECTED";
  if (message === "NO_SOURCE_CONTEXT_AVAILABLE") return "NO_SOURCE_CONTEXT";
  return message;
}

function toFormOrderInput(body: z.infer<typeof bodySchema>): FormOrderInput {
  return {
    identityVerified: body.formOrder.identityVerified,
    brokerageContractSigned: body.formOrder.brokerageContractSigned,
    sellerDeclarationCompleted: body.formOrder.sellerDeclarationCompleted,
    promiseToPurchaseSigned: body.formOrder.promiseToPurchaseSigned,
    finalReviewCompleted: body.formOrder.finalReviewCompleted,
    signatureCompleted: body.formOrder.signatureCompleted,
    transactionType: body.formOrder.transactionType,
  };
}

/**
 * System-trusted execution path: form order → DS → signature + hash → draft → validation → release gate → audit persist.
 */
export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  if (auth.user.role !== PlatformRole.BROKER) {
    return NextResponse.json({ error: "BROKER_ROLE_REQUIRED" }, { status: 403 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (body.signature.signerId !== auth.user.id) {
    return NextResponse.json({ error: "SIGNER_MISMATCH" }, { status: 403 });
  }

  const licenceBlock = await requireActiveResidentialBrokerLicence(auth.user.id, {
    dealType: body.formType,
    actorBrokerId: auth.user.id,
    assignedBrokerId: auth.user.id,
  });
  if (licenceBlock) return licenceBlock;

  const inspectionBlock = await rejectIfInspectionReadOnlyMutation(req, {
    ownerType: "solo_broker",
    ownerId: auth.user.id,
    actorId: auth.user.id,
    actorType: "broker",
  });
  if (inspectionBlock) return inspectionBlock;

  if (body.aiGenerated && !body.brokerReviewed) {
    return NextResponse.json({ error: "BROKER_REVIEW_REQUIRED" }, { status: 403 });
  }

  const formOrderInput = toFormOrderInput(body);

  try {
    assertFormOrderStepAccess(formOrderInput, "signature");
    enforceFormOrder(formOrderInput);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "FORM_ORDER_FAILED";
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  const dsNormalized = withDSReference(body.ds as SellerDeclarationInput);

  try {
    validateDS(dsNormalized);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "DS_LINK_REQUIRED";
    if (msg === "DS_MUST_BE_LINKED_TO_TRANSACTION") {
      return NextResponse.json({ error: "DS_LINK_REQUIRED" }, { status: 403 });
    }
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  const dsLinked = Boolean(dsNormalized.listingId?.trim() || dsNormalized.contractId?.trim());
  if (!dsLinked) {
    return NextResponse.json({ error: "DS_LINK_REQUIRED" }, { status: 403 });
  }

  const signaturePayload: SignaturePayload = {
    signerId: body.signature.signerId,
    signerType: body.signature.signerType,
    signedDate: body.signature.signedDate,
    signedTime: body.signature.signedTime,
    signedCity: body.signature.signedCity,
    signedAt: body.signature.signedAt ? new Date(body.signature.signedAt) : undefined,
  };

  try {
    assertSignatureReleaseRules(signaturePayload, body.hash);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "SIGNATURE_REQUIRED";
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  let draft;
  try {
    draft = await generateDraft({
      formType: body.formType,
      facts: body.facts ?? {},
      listing: body.listing,
    });
  } catch (e) {
    const raw = e instanceof Error ? e.message : "DRAFT_FAILED";
    const code = mapDraftError(raw);
    const status =
      code === "NO_SOURCE_CONTEXT" ? 422
      : code === "CONFLICT_DETECTED" ? 409
      : 400;
    return NextResponse.json({ error: code, detail: raw }, { status });
  }

  const validation = validateDraft(draft.fields);
  if (!validation.valid) {
    await logAuditEvent({
      ownerType: "solo_broker",
      ownerId: auth.user.id,
      entityType: "contract_draft",
      entityId: body.entityId ?? `${auth.user.id}:${body.formType}`,
      actionType: "clause_validation_failed",
      moduleKey: "contracts",
      actorType: "broker",
      actorId: auth.user.id,
      linkedListingId: dsNormalized.listingId?.trim() || null,
      linkedContractId: dsNormalized.contractId?.trim() || null,
      aiAssisted: !!body.aiGenerated,
      humanReviewRequired: !!body.aiGenerated,
      humanReviewCompleted: !!body.brokerReviewed,
      severity: "high",
      summary: "Draft field validation failed",
      details: { formType: body.formType, errors: validation.errors },
    });
    return NextResponse.json({ error: "VALIDATION_FAILED", errors: validation.errors }, { status: 400 });
  }

  const consistency = checkConsistency({
    listing: body.listing,
    draft: draft.fields,
  });
  if (!consistency.valid) {
    await logAuditEvent({
      ownerType: "solo_broker",
      ownerId: auth.user.id,
      entityType: "contract_draft",
      entityId: body.entityId ?? `${auth.user.id}:${body.formType}`,
      actionType: "clause_validation_failed",
      moduleKey: "contracts",
      actorType: "broker",
      actorId: auth.user.id,
      linkedListingId: dsNormalized.listingId?.trim() || null,
      linkedContractId: dsNormalized.contractId?.trim() || null,
      aiAssisted: !!body.aiGenerated,
      severity: "high",
      summary: "Draft consistency / contradiction check failed",
      details: { formType: body.formType, errors: consistency.errors },
    });
    return NextResponse.json({ error: "CONFLICT_DETECTED", errors: consistency.errors }, { status: 409 });
  }

  const facts = body.facts ?? {};
  const listingId = dsNormalized.listingId?.trim() || factString(facts, "listingId");
  const dealId = factString(facts, "dealId");
  const contractId = dsNormalized.contractId?.trim() || factString(facts, "contractId");

  if (listingId) {
    const txCtx = await getOrSyncTransactionContext({ entityType: "LISTING", entityId: listingId });
    const boundaryBlock = await assertBrokeredTransaction(txCtx, "binding_contract_execution", auth.user.id, {
      auditAllowSuccess: true,
    });
    if (boundaryBlock) return boundaryBlock;
  } else if (dealId) {
    const txCtx = await getOrSyncTransactionContext({ entityType: "DEAL", entityId: dealId });
    const boundaryBlock = await assertBrokeredTransaction(txCtx, "binding_contract_execution", auth.user.id, {
      auditAllowSuccess: true,
    });
    if (boundaryBlock) return boundaryBlock;
  }

  let contractNumber: string;
  try {
    contractNumber = await ensureContractRegistryNumber({
      contractType: body.formType,
      createdById: auth.user.id,
      listingId: listingId ?? null,
      dealId: dealId ?? null,
      contractId: contractId ?? null,
      existingNumber: body.contractNumber ?? null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "CONTRACT_NUMBER_ALLOCATION_FAILED";
    if (msg === "UNKNOWN_CONTRACT_NUMBER") {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: msg }, { status: 503 });
  }

  const signatureComplete =
    body.formOrder.signatureCompleted && body.signature.signerType === "broker";
  const inspection = runInspection({
    dsLinked,
    signature: signatureComplete,
    hash: body.hash,
    contractNumber,
  });

  if (body.persistAuditTrail) {
    try {
      await prisma.complianceInspection.create({
        data: {
          ownerId: auth.user.id,
          result: inspection.result,
          issues: inspection.issues,
          context: {
            formType: body.formType,
            contractNumber,
            listingId: listingId ?? null,
            dealId: dealId ?? null,
            contractId: contractId ?? null,
          },
        },
      });
      await recordAuditEvent({
        actorUserId: auth.user.id,
        action: "COMPLIANCE_INSPECTION_RECORDED",
        payload: {
          result: inspection.result,
          issues: inspection.issues,
          contractNumber,
        },
      });
    } catch (e) {
      logError("[drafting.execute.inspection-persist]", e);
      return NextResponse.json({ error: "INSPECTION_PERSIST_FAILED" }, { status: 503 });
    }
  }

  const brokerReviewDone = !body.aiGenerated || !!body.brokerReviewed;
  const brokerSigned =
    body.formOrder.signatureCompleted && body.signature.signerType === "broker" && Boolean(body.hash?.trim());

  const release = canReleaseTransaction({
    formOrderValid: true,
    draftValid: validation.valid,
    noContradictions: consistency.valid,
    sourceCoverageValid: (draft.sourceUsed?.length ?? 0) > 0,
    brokerReviewDone,
    brokerSigned,
    documentHashPresent: Boolean(body.hash?.trim()),
    dsLinked,
    contractNumberPresent: Boolean(contractNumber?.trim()),
    inspectionPassed: inspection.result === "pass",
    guardrailsPassed: true,
  });

  if (!release.allowed) {
    const err = release.errors[0] ?? "RELEASE_BLOCKED";
    await logAuditEvent({
      ownerType: "solo_broker",
      ownerId: auth.user.id,
      entityType: "contract_draft",
      entityId: body.entityId ?? `${auth.user.id}:${body.formType}`,
      actionType: "contract_release_blocked",
      moduleKey: "contracts",
      actorType: "broker",
      actorId: auth.user.id,
      linkedListingId: listingId ?? null,
      linkedDealId: dealId ?? null,
      linkedContractId: contractId ?? null,
      aiAssisted: !!body.aiGenerated,
      humanReviewRequired: !!body.aiGenerated,
      humanReviewCompleted: !!body.brokerReviewed,
      severity: "high",
      summary: "Transaction release blocked — gating rules not satisfied",
      details: { formType: body.formType, errors: release.errors, contractNumber },
    });
    return NextResponse.json({ error: err, errors: release.errors }, { status: 403 });
  }

  const entityType = body.entityType ?? "drafting_execute";
  const entityId = body.entityId ?? `${auth.user.id}:${dsNormalized.referenceNumber}`;

  try {
    await enforceAction({
      ownerType: "solo_broker",
      ownerId: auth.user.id,
      actorId: auth.user.id,
      actionKey: "approve_contract",
      entityType: "transaction_release",
      entityId,
      moduleKey: "contracts",
      facts: {
        releaseTransaction: true,
        fullReleaseGate: true,
        formOrderValid: true,
        draftValid: validation.valid,
        noContradictions: consistency.valid,
        sourceCoverageValid: (draft.sourceUsed?.length ?? 0) > 0,
        brokerReviewDone,
        brokerSigned,
        documentHashPresent: Boolean(body.hash?.trim()),
        dsLinked,
        formType: body.formType,
        contractNumber,
        listingId: listingId ?? null,
        dealId: dealId ?? null,
        contractId: contractId ?? null,
        referenceNumber: dsNormalized.referenceNumber,
        aiGenerated: body.aiGenerated ?? false,
        brokerReviewed: body.brokerReviewed ?? false,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ACTION_BLOCKED";
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  if (body.persistAuditTrail) {
    const signedAt = signaturePayload.signedAt ?? new Date();
    try {
      await prisma.$transaction([
        prisma.sellerDeclaration.upsert({
          where: { referenceNumber: dsNormalized.referenceNumber },
          create: {
            listingId: dsNormalized.listingId?.trim() || null,
            contractId: dsNormalized.contractId?.trim() || null,
            referenceNumber: dsNormalized.referenceNumber,
            status: "linked",
          },
          update: {
            listingId: dsNormalized.listingId?.trim() || null,
            contractId: dsNormalized.contractId?.trim() || null,
            status: "linked",
          },
        }),
        prisma.formSignature.create({
          data: {
            entityType,
            entityId,
            signerId: auth.user.id,
            signerType: body.signature.signerType,
            signedAt,
            signedDate: body.signature.signedDate,
            signedTime: body.signature.signedTime,
            signedCity: body.signature.signedCity,
            signatureMethod: body.signatureMethod,
            signatureHash: computeSignatureRecordHash({
              signerId: auth.user.id,
              signerType: body.signature.signerType,
              signedAtIso: signedAt.toISOString(),
              signatureMethod: body.signatureMethod,
              documentHash: body.hash,
            }),
            documentHash: body.hash,
          },
        }),
      ]);
    } catch (e) {
      logError("[drafting.execute.compliance-audit]", e);
      return NextResponse.json({ error: "AUDIT_PERSIST_FAILED" }, { status: 503 });
    }
  }

  await logAuditEvent({
    ownerType: "solo_broker",
    ownerId: auth.user.id,
    entityType: "contract",
    entityId,
    actionType: "contract_executed",
    moduleKey: "contracts",
    actorType: "broker",
    actorId: auth.user.id,
    linkedListingId: listingId ?? null,
    linkedDealId: dealId ?? null,
    linkedContractId: contractId ?? null,
    aiAssisted: !!body.aiGenerated,
    humanReviewRequired: !!body.aiGenerated,
    humanReviewCompleted: !body.aiGenerated || !!body.brokerReviewed,
    severity: "info",
    summary: "Contract execution path completed — DS linked, signature and inspection recorded",
    details: {
      formType: body.formType,
      contractNumber,
      inspectionResult: inspection.result,
      referenceNumber: dsNormalized.referenceNumber,
      persistedAuditTrail: body.persistAuditTrail,
    },
  });

  if (listingId) {
    const txCtx = await getOrSyncTransactionContext({ entityType: "LISTING", entityId: listingId });
    await writeSignatureBoundaryAudit({
      entityId: listingId,
      entityType: "LISTING",
      mode: txCtx.mode,
      detail: `broker_signature_recorded formType=${body.formType} contractNumber=${contractNumber ?? ""}`,
      actorUserId: auth.user.id,
    });
  } else if (dealId) {
    const txCtx = await getOrSyncTransactionContext({ entityType: "DEAL", entityId: dealId });
    await writeSignatureBoundaryAudit({
      entityId: dealId,
      entityType: "DEAL",
      mode: txCtx.mode,
      detail: `broker_signature_recorded formType=${body.formType} contractNumber=${contractNumber ?? ""}`,
      actorUserId: auth.user.id,
    });
  }

  return NextResponse.json({
    success: true,
    sellerDeclarationReference: dsNormalized.referenceNumber,
    contractNumber,
    complianceInspection: inspection,
    draft: {
      fields: draft.fields,
      sourceUsed: draft.sourceUsed,
      validation,
      consistency,
    },
  });
}
