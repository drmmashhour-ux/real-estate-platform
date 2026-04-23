import { BrokerStatus, PlatformRole, VerificationStatus } from "@prisma/client";
import { evaluateOaciqRuleEngine } from "@/lib/compliance/oaciq/evaluate-rules";
import { LECIPM_LICENCE_RULE_ENGINE } from "@/lib/compliance/oaciq/licence-rule-engine";
import type { OaciqComplianceRiskLevel } from "@/lib/compliance/oaciq/rule-engine.types";
import { prisma } from "@/lib/db";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

const COMMERCIAL_HINT =
  /commercial|industrial|retail|office|hotel|institution|strip\s*mall|warehouse|cap\s*rate|multi\s*family\s*5|plex\s*5|5\s*plex|6\s*plex/i;

export type BrokerageScopeInput = {
  dealType?: string | null;
  transactionType?: string | null;
  dwellingUnitCount?: number | null;
  assignedBrokerId?: string | null;
  actorBrokerId?: string | null;
};

export type BrokerLicenceEvaluation = {
  allowed: boolean;
  riskLevel: OaciqComplianceRiskLevel;
  uiStatus: "verified" | "warning" | "blocked";
  label: string;
  reasons: string[];
  warnings: string[];
};

function isResidentialScopeHint(dealType: string | null | undefined, transactionType: string | null | undefined): boolean {
  const t = `${dealType ?? ""} ${transactionType ?? ""}`.trim();
  if (!t) return true;
  return !COMMERCIAL_HINT.test(t);
}

function isDwellingCountInScope(count: number | null | undefined): boolean {
  if (count == null) return true;
  return count < 5;
}

export function buildOaciqLicenceContext(input: {
  user: { id: string; role: PlatformRole; brokerStatus: BrokerStatus; emailVerifiedAt: Date | null };
  brokerVerification: { verificationStatus: VerificationStatus; licenseNumber: string } | null;
  profile: { licenceType: string; licenceStatus: string } | null;
  scope: BrokerageScopeInput;
}): Record<string, unknown> {
  const verificationOk = input.brokerVerification?.verificationStatus === VerificationStatus.VERIFIED;
  const brokerPlatformOk =
    input.user.role === PlatformRole.BROKER && input.user.brokerStatus === BrokerStatus.VERIFIED;
  const identityOk = Boolean(input.user.emailVerifiedAt) && verificationOk;

  const profile = input.profile;
  const profileActive = !profile || profile.licenceStatus !== "inactive";
  const categoryOk = !profile || profile.licenceType === "residential";

  const scopeOk =
    isResidentialScopeHint(input.scope.dealType, input.scope.transactionType) &&
    isDwellingCountInScope(input.scope.dwellingUnitCount);

  const assigned =
    !input.scope.assignedBrokerId ||
    !input.scope.actorBrokerId ||
    input.scope.assignedBrokerId === input.scope.actorBrokerId;

  const is_licence_active = brokerPlatformOk && verificationOk && profileActive && categoryOk;
  const is_residential_scope_valid = scopeOk;
  const is_transaction_type_allowed = assigned;

  return {
    verify_broker_identity: identityOk,
    verify_oaciq_licence_status: verificationOk,
    verify_licence_category: categoryOk,
    attach_broker_to_every_transaction: assigned,
    allow_unlicensed_user_to_act_as_broker: !brokerPlatformOk || !verificationOk,
    allow_ai_to_execute_legal_actions: false,
    allow_out_of_scope_transaction: !scopeOk,
    is_licence_active,
    is_residential_scope_valid,
    is_transaction_type_allowed,
    manual_regulator_review_completed: false,
  };
}

export async function evaluateBrokerLicenceForBrokerage(input: {
  brokerUserId: string;
  scope?: BrokerageScopeInput;
  /** When false, skip `LecipmLicenceCheck` row + audit event (e.g. dashboard badge polling). */
  persistCheck?: boolean;
}): Promise<BrokerLicenceEvaluation> {
  const scope = input.scope ?? {};
  const persist = input.persistCheck !== false;

  const user = await prisma.user.findUnique({
    where: { id: input.brokerUserId },
    select: {
      id: true,
      role: true,
      brokerStatus: true,
      emailVerifiedAt: true,
      brokerVerifications: {
        take: 1,
        select: { verificationStatus: true, licenseNumber: true },
      },
      lecipmBrokerLicenceProfile: {
        select: { id: true, licenceType: true, licenceStatus: true },
      },
    },
  });

  const warnings: string[] = [];

  if (!user) {
    return {
      allowed: false,
      riskLevel: "HIGH",
      uiStatus: "blocked",
      label: "Blocked — unknown account",
      reasons: ["UNKNOWN_BROKER_ACCOUNT"],
      warnings,
    };
  }

  const bv = user.brokerVerifications[0] ?? null;
  const profile = user.lecipmBrokerLicenceProfile;

  const ctx = buildOaciqLicenceContext({
    user,
    brokerVerification: bv,
    profile,
    scope,
  });

  const engineResult = evaluateOaciqRuleEngine(LECIPM_LICENCE_RULE_ENGINE, ctx, "LOW");

  const reasons: string[] = [...engineResult.blockedReasons];

  if (!scope.dealType && !scope.transactionType && scope.dwellingUnitCount == null) {
    warnings.push("PROPERTY_CLASSIFICATION_UNCLEAR_REVIEW_MANUALLY");
  }

  const allowed = engineResult.outcome !== "block";
  let riskLevel: OaciqComplianceRiskLevel = allowed ? (warnings.length > 0 ? "MEDIUM" : engineResult.complianceRiskScore) : "HIGH";

  if (allowed && engineResult.outcome === "warn") {
    warnings.push(...engineResult.warnings);
    if (riskLevel === "LOW") riskLevel = "MEDIUM";
  }

  const uiStatus: BrokerLicenceEvaluation["uiStatus"] = !allowed ? "blocked" : riskLevel === "LOW" ? "verified" : "warning";
  const label = !allowed
    ? "Blocked — OACIQ licence / residential scope"
    : riskLevel === "LOW"
      ? "Licence verified (residential)"
      : "Scope warning — confirm classification before acting";

  if (persist) {
    await prisma.lecipmLicenceCheck.create({
      data: {
        brokerId: input.brokerUserId,
        profileId: profile?.id ?? null,
        isValid: allowed,
        scopeValid: Boolean(ctx.is_residential_scope_valid),
        riskLevel,
        contextJson: { reasons, warnings, scope, engine: engineResult },
      },
    });

    const auditAction =
      !allowed && ctx.is_residential_scope_valid === false
        ? "scope_violation_attempt"
        : !allowed
          ? "licence_invalid_block"
          : "licence_checked";

    await recordAuditEvent({
      actorUserId: input.brokerUserId,
      action: auditAction,
      payload: {
        allowed,
        riskLevel,
        reasons,
        warnings,
        scope,
      },
    });
  }

  return {
    allowed,
    riskLevel,
    uiStatus,
    label,
    reasons,
    warnings,
  };
}

export async function getBrokerLicenceDisplay(brokerUserId: string): Promise<BrokerLicenceEvaluation> {
  return evaluateBrokerLicenceForBrokerage({ brokerUserId, scope: {}, persistCheck: false });
}
