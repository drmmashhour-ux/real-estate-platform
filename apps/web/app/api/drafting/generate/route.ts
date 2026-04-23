import { NextResponse } from "next/server";
import { z } from "zod";
import { generateSourceGroundedDraft } from "@/lib/ai/generate-source-grounded-draft";
import { validateDraftWithFormType, checkConsistency } from "@/lib/compliance/draft-validation";
import { checkDraftConsistency } from "@/lib/compliance/draft-consistency";
import { checkSourceCoverage } from "@/lib/compliance/draft-source-coverage";
import { canReleaseDraftedTransaction } from "@/lib/compliance/draft-release";
import { getRequiredNextStep } from "@/lib/compliance/form-order";
import { requireUser } from "@/lib/auth/require-user";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";
import { evaluateOaciqVia } from "@/lib/compliance/oaciq/verify-inform-advise/evaluate";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  formType: z.string().min(1),
  transactionType: z.enum(["sale", "purchase", "lease", "vacation_resort"]).optional().default("sale"),
  knownFacts: z.record(z.unknown()).optional().default({}),
  userQuery: z.string().optional(),
  listing: z.object({ address: z.string().optional().nullable() }).optional(),
  sellerDeclaration: z.object({ sellerName: z.string().optional().nullable() }).optional(),
  brokerageContract: z.record(z.unknown()).optional(),
  promiseToPurchase: z
    .object({
      buyerName: z.string().optional().nullable(),
      offerPrice: z.union([z.string(), z.number()]).optional().nullable(),
    })
    .optional(),
  aiGenerated: z.boolean().optional(),
  brokerReviewed: z.boolean().optional(),
  brokerReviewCompleted: z.boolean().optional(),
  brokerSigned: z.boolean().optional(),
  complianceGuardrailsPassed: z.boolean().optional(),
  /** When true, client asserts prior mandatory workflow steps are complete (identity → contract → …). */
  stepOrderValid: z.boolean().optional(),
  workflow: z
    .object({
      hasIdentityVerification: z.boolean().optional(),
      hasBrokerageContract: z.boolean().optional(),
      hasSellerDeclaration: z.boolean().optional(),
      hasDisclosure: z.boolean().optional(),
      hasPromiseToPurchase: z.boolean().optional(),
    })
    .optional(),
});

function populatedFieldKeys(fields: Record<string, unknown>): string[] {
  return Object.entries(fields)
    .filter(([key, value]) => {
      if (key === "sourceExcerpts" || key === "retrievedAt" || key === "formType") return false;
      return value !== "" && value !== null && value !== undefined && value !== "REQUIRED_REVIEW";
    })
    .map(([key]) => key);
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (body.aiGenerated && !body.brokerReviewed) {
    return NextResponse.json({ error: "BROKER_REVIEW_REQUIRED" }, { status: 403 });
  }

  const userQuery =
    body.userQuery?.trim() ||
    `Draft ${body.formType} using approved OACIQ and brokerage sources`;

  const wf = body.workflow ?? {};
  const brokerReviewCompleted = body.brokerReviewCompleted ?? (!body.aiGenerated || body.brokerReviewed === true);
  const brokerSigned = body.brokerSigned ?? false;

  const nextStep = getRequiredNextStep({
    transactionType: body.transactionType,
    hasIdentityVerification: wf.hasIdentityVerification ?? true,
    hasBrokerageContract: wf.hasBrokerageContract ?? true,
    hasSellerDeclaration: wf.hasSellerDeclaration ?? true,
    hasDisclosure: wf.hasDisclosure ?? true,
    hasPromiseToPurchase: wf.hasPromiseToPurchase ?? true,
    reviewCompleted: brokerReviewCompleted,
    signed: brokerSigned,
  });
  /** When omitted, do not block on workflow order (pass `false` + `workflow` to enforce). */
  const stepOrderValid = body.stepOrderValid ?? true;

  const draft = await generateSourceGroundedDraft({
    formType: body.formType,
    knownFacts: body.knownFacts ?? {},
    userQuery,
    transactionType: body.transactionType ?? "sale",
    userId: auth.user.id, // Phase 3: Pass userId for broker identity injection
  });

  const validation = validateDraftWithFormType({ formType: body.formType, fields: draft.fields });

  const consistency = checkDraftConsistency({
    listing: body.listing,
    sellerDeclaration: body.sellerDeclaration,
    brokerageContract: body.brokerageContract,
    promiseToPurchase: body.promiseToPurchase,
    draft: { fields: draft.fields },
  });

  const listingConsistency = checkConsistency({ listing: body.listing, draft: draft.fields });
  const mergedContradictions = {
    valid: consistency.valid && listingConsistency.valid,
    errors: [...consistency.errors, ...(listingConsistency.valid ? [] : listingConsistency.errors)],
    warnings: consistency.warnings,
  };

  const requiredFields = populatedFieldKeys(draft.fields);
  const sourceCoverage = checkSourceCoverage({
    sourceUsed: draft.sourceUsed,
    requiredFields,
  });

  const complianceGuardrailsPassed = body.complianceGuardrailsPassed ?? true;
  const requiredReviewResolved = (draft.requiredReviewFields?.length ?? 0) === 0;

  const releaseGate = canReleaseDraftedTransaction({
    stepOrderValid,
    draftValidationPassed: validation.valid,
    contradictionCheckPassed: mergedContradictions.valid,
    sourceCoveragePassed: sourceCoverage.sufficient,
    requiredReviewFieldsResolved: requiredReviewResolved,
    brokerReviewCompleted,
    brokerSigned,
    guardrailsPassed: complianceGuardrailsPassed,
  });

  const releaseReady = releaseGate.allowed;

  const blockingCodes: string[] = [];
  if (!stepOrderValid) blockingCodes.push("FORM_ORDER_INVALID");
  if ((draft.requiredReviewFields?.length ?? 0) > 0) blockingCodes.push("REQUIRED_REVIEW_FIELDS_UNRESOLVED");
  if (!validation.valid) blockingCodes.push("DRAFT_VALIDATION_FAILED");
  if (!mergedContradictions.valid) blockingCodes.push("DRAFT_CONTRADICTIONS_PRESENT");
  if (!sourceCoverage.sufficient) blockingCodes.push("SOURCE_COVERAGE_REQUIRED");
  if (!draft.passages?.length) blockingCodes.push("SOURCE_RETRIEVAL_REQUIRED");
  if (!brokerReviewCompleted) blockingCodes.push("BROKER_REVIEW_REQUIRED");
  if (!brokerSigned) blockingCodes.push("BROKER_SIGNATURE_REQUIRED");
  if (!complianceGuardrailsPassed) blockingCodes.push("COMPLIANCE_GUARDRAILS_NOT_PASSED");

  const oaciqVia = evaluateOaciqVia({
    verificationSourcesCount: draft.passages?.length ?? 0,
    sourceCoverageSufficient: sourceCoverage.sufficient,
    requiredReviewOpen: (draft.requiredReviewFields?.length ?? 0) > 0,
    workflowComplete: stepOrderValid,
  });
  if (!oaciqVia.advicePermitted) {
    blockingCodes.push("OACIQ_VIA_ADVICE_NOT_PERMITTED");
  }

  await recordAuditEvent({
    actorUserId: auth.user.id,
    action: "ai_draft_generated",
    payload: {
      entityType: "ai_draft",
      moduleKey: "forms",
      aiAssisted: true,
      severity: blockingCodes.length > 0 ? "warning" : "info",
      summary: `Source-grounded draft generated for ${body.formType}`,
      details: {
        formType: body.formType,
        transactionType: body.transactionType,
        sourceCount: draft.sourceUsed?.length ?? 0,
        missingFields: draft.missingFields ?? [],
        requiredReviewFields: draft.requiredReviewFields ?? [],
        validationErrors: validation.errors ?? [],
        contradictionErrors: mergedContradictions.errors ?? [],
        uncoveredFields: sourceCoverage.uncoveredFields,
        passagesRetrieved: draft.passages?.length ?? 0,
        promptUsed: draft.promptUsed,
        releaseReady,
        releaseGateErrors: releaseGate.errors,
        blockingCodes,
        nextWorkflowStep: nextStep,
        oaciqVia: {
          riskLevel: oaciqVia.riskLevel,
          advicePermitted: oaciqVia.advicePermitted,
          verifyPhaseComplete: oaciqVia.verifyPhaseComplete,
        },
      },
    },
  });

  return NextResponse.json(
    {
      success: blockingCodes.length === 0,
      draft,
      validation,
      consistency: mergedContradictions,
      sourceCoverage,
      releaseReady,
      releaseGate,
      nextWorkflowStep: nextStep,
      blockingCodes,
      oaciqVia,
      gates: {
        brokerReviewCompleted,
        brokerSigned,
        complianceGuardrailsPassed,
        stepOrderValid,
      },
    },
    { status: blockingCodes.length > 0 ? 422 : 200 },
  );
}
