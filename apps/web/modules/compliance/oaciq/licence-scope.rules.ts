import type { ComplianceCaseContext, ComplianceRule, ComplianceRuleResult } from "@/modules/compliance/core/rule-types";

function r(
  id: string,
  passed: boolean,
  severity: ComplianceRuleResult["severity"],
  code: string,
  title: string,
  message: string,
  blocking?: boolean,
  requiredActions?: string[],
): ComplianceRuleResult {
  return { ruleId: id, passed, severity, code, title, message, blocking, requiredActions };
}

export const licenceScopeRules: ComplianceRule[] = [
  {
    id: "verify_broker_identity",
    category: "licence",
    evaluate(ctx) {
      const b = ctx.brokerageLicence;
      if (!b) return null;
      return r(
        "verify_broker_identity",
        b.brokerIdentityVerified,
        b.brokerIdentityVerified ? "low" : "critical",
        "LIC_ID",
        "Broker identity",
        b.brokerIdentityVerified
          ? "Broker identity verification path satisfied for regulated activity."
          : "Verify broker identity before any brokerage act for remuneration.",
        !b.brokerIdentityVerified,
        b.brokerIdentityVerified ? undefined : ["Complete identity / account verification"],
      );
    },
  },
  {
    id: "verify_oaciq_licence_status",
    category: "licence",
    evaluate(ctx) {
      const b = ctx.brokerageLicence;
      if (!b) return null;
      return r(
        "verify_oaciq_licence_status",
        b.oaciqLicenceRecordVerified,
        b.oaciqLicenceRecordVerified ? "low" : "critical",
        "LIC_OACIQ",
        "OACIQ licence record",
        b.oaciqLicenceRecordVerified
          ? "OACIQ licence record verified on platform."
          : "A valid OACIQ licence must be recorded and verified before brokerage activity.",
        !b.oaciqLicenceRecordVerified,
        !b.oaciqLicenceRecordVerified ? ["Record OACIQ licence", "Confirm active status"] : undefined,
      );
    },
  },
  {
    id: "verify_licence_category",
    category: "licence",
    evaluate(ctx) {
      const b = ctx.brokerageLicence;
      if (!b) return null;
      return r(
        "verify_licence_category",
        b.licenceCategoryResidential,
        b.licenceCategoryResidential ? "low" : "critical",
        "LIC_CAT",
        "Residential category",
        b.licenceCategoryResidential
          ? "Licence category is residential — aligned with LECIPM residential product scope."
          : "LECIPM residential brokerage requires a residential OACIQ licence category.",
        !b.licenceCategoryResidential,
      );
    },
  },
  {
    id: "licence_status_active",
    category: "licence",
    evaluate(ctx) {
      const b = ctx.brokerageLicence;
      if (!b) return null;
      return r(
        "licence_status_active",
        b.licenceStatusActive,
        b.licenceStatusActive ? "low" : "critical",
        "LIC_ACTIVE",
        "Active licence",
        b.licenceStatusActive
          ? "Licence status is active."
          : "Brokerage for remuneration requires an active OACIQ licence.",
        !b.licenceStatusActive,
      );
    },
  },
  {
    id: "attach_broker_to_every_transaction",
    category: "licence",
    evaluate(ctx) {
      const b = ctx.brokerageLicence;
      if (!b) return null;
      return r(
        "attach_broker_to_every_transaction",
        b.brokerAttachedToTransaction,
        b.brokerAttachedToTransaction ? "low" : "critical",
        "LIC_ATTACH",
        "Broker assigned",
        b.brokerAttachedToTransaction
          ? "Acting broker is assigned to this transaction."
          : "Every regulated file must name the OACIQ-licensed broker responsible.",
        !b.brokerAttachedToTransaction,
      );
    },
  },
  {
    id: "ai_may_not_execute_legal_brokerage",
    category: "licence",
    evaluate(ctx) {
      const b = ctx.brokerageLicence;
      if (!b) return null;
      return r(
        "ai_may_not_execute_legal_brokerage",
        b.platformAcknowledgesAiAssistOnly,
        b.platformAcknowledgesAiAssistOnly ? "low" : "critical",
        "LIC_AI",
        "AI assist only",
        b.platformAcknowledgesAiAssistOnly
          ? "Platform posture: AI assists; the broker performs legal brokerage acts."
          : "Automation must not present as executing OACIQ-regulated brokerage decisions.",
        !b.platformAcknowledgesAiAssistOnly,
      );
    },
  },
  {
    id: "residential_scope_transaction_allowed",
    category: "licence",
    evaluate(ctx) {
      const b = ctx.brokerageLicence;
      if (!b) return null;
      const ok = b.transactionWithinResidentialScope;
      return r(
        "residential_scope_transaction_allowed",
        ok,
        ok ? "low" : "critical",
        "LIC_SCOPE",
        "Residential scope",
        ok
          ? "Transaction appears within residential licence scope (<5 dwellings, non-commercial path)."
          : "This transaction may exceed residential licence scope — stop until a licensed broker confirms authority.",
        !ok,
        ok ? undefined : ["Confirm asset class", "Document mandate scope"],
      );
    },
  },
  {
    id: "property_classification_unclear_risk",
    category: "licence",
    evaluate(ctx) {
      const b = ctx.brokerageLicence;
      if (!b) return null;
      if (!b.propertyClassificationUnclear) return null;
      return r(
        "property_classification_unclear_risk",
        false,
        "medium",
        "LIC_CLASS_UNCLEAR",
        "Classification unclear",
        "Property classification is unclear — confirm manually before acting; elevated compliance risk.",
        false,
        ["Classify dwelling count / use", "Broker sign-off"],
      );
    },
  },
];
