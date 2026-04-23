import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { requireUser } from "@/lib/auth/require-user";
import { complianceFlags } from "@/config/feature-flags";
import {
  brokerFinalApproval,
  DEFAULT_AML_DEAL_SCAN_RULE_IDS,
  mergeDealAMLContextRelaxed,
  validateDealAMLCompliance,
} from "@/lib/compliance/oaciq/aml";
import type { DealAMLComplianceContext } from "@/lib/compliance/oaciq/aml/types";

export const dynamic = "force-dynamic";

function isBool(v: unknown): v is boolean {
  return typeof v === "boolean";
}

function readContextField(body: Record<string, unknown>, key: string): boolean | undefined {
  const raw = body[key];
  return isBool(raw) ? raw : undefined;
}

/** POST — dry-run OACIQ AML / fraud-indicator scan (broker or admin). */
export async function POST(req: Request) {
  if (!complianceFlags.oaciqAmlEngineV1) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 404 });
  }

  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  if (auth.user.role !== PlatformRole.BROKER && auth.user.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const nested =
    body.context && typeof body.context === "object" && body.context !== null
      ? (body.context as Record<string, unknown>)
      : body;

  const partial = {
    illegalActivitySuspected: readContextField(nested, "illegalActivitySuspected"),
    identityVerified: readContextField(nested, "identityVerified"),
    legalCapacityConfirmed: readContextField(nested, "legalCapacityConfirmed"),
    trustAccountHoldsUnrelatedFunds: readContextField(nested, "trustAccountHoldsUnrelatedFunds"),
    suspiciousPatternDetected: readContextField(nested, "suspiciousPatternDetected"),
    transactionCompleted: readContextField(nested, "transactionCompleted"),
    recordsCompleteAndAccessible: readContextField(nested, "recordsCompleteAndAccessible"),
    reportingObligationsUpToDate: readContextField(nested, "reportingObligationsUpToDate"),
    priceVsDeclaredValueMismatch: readContextField(nested, "priceVsDeclaredValueMismatch"),
    nomineeOrHiddenBeneficiarySuspected: readContextField(nested, "nomineeOrHiddenBeneficiarySuspected"),
    structuringPatternSuspected: readContextField(nested, "structuringPatternSuspected"),
    transactionAbnormallyFastWithoutJustification: readContextField(
      nested,
      "transactionAbnormallyFastWithoutJustification",
    ),
    mortgageExceedsPropertyValue: readContextField(nested, "mortgageExceedsPropertyValue"),
  };

  const defined = Object.fromEntries(
    Object.entries(partial).filter(([, v]) => v !== undefined),
  ) as Partial<DealAMLComplianceContext>;

  const ctx = mergeDealAMLContextRelaxed(defined);

  let ruleIds: readonly string[] | undefined;
  if (Array.isArray(body.ruleIds) && body.ruleIds.every((x) => typeof x === "string")) {
    ruleIds = body.ruleIds as string[];
  }

  const evaluation = validateDealAMLCompliance(ctx, ruleIds ?? DEFAULT_AML_DEAL_SCAN_RULE_IDS);
  const broker_approval = brokerFinalApproval(evaluation);

  return NextResponse.json({
    success: true,
    evaluation,
    broker_approval,
    context_preview: ctx,
  });
}
