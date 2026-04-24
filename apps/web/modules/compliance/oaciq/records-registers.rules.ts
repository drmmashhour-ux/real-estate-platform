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

export const recordsRegistersRules: ComplianceRule[] = [
  {
    id: "records_registers_up_to_date",
    category: "records",
    evaluate(ctx) {
      if (ctx.metadata?.recordsCheckRequired !== true) return null;
      const ok = ctx.metadata.recordsRegistersUpToDate === true;
      return r(
        "records_registers_up_to_date",
        ok,
        ok ? "low" : "high",
        "REC_CURRENT",
        "Registers current",
        ok ? "Books and registers are current." : "Update books, registers, and internal logs without delay.",
        !ok,
      );
    },
  },
  {
    id: "broker_forwards_required_information",
    category: "records",
    evaluate(ctx) {
      if (ctx.metadata?.agencyInformationForwardRequired !== true) return null;
      const ok = ctx.metadata.brokerForwardedInformation === true;
      return r(
        "broker_forwards_required_information",
        ok,
        ok ? "low" : "medium",
        "REC_FORWARD",
        "Forward to agency",
        ok ? "Required information forwarded to agency." : "Forward collected information to agency without delay.",
        false,
      );
    },
  },
  {
    id: "record_medium_defined",
    category: "records",
    evaluate(ctx) {
      if (ctx.metadata?.recordsPolicyApplicable !== true) return null;
      const ok = ctx.metadata.recordMediumDefined === true;
      return r(
        "record_medium_defined",
        ok,
        ok ? "low" : "medium",
        "REC_MEDIUM",
        "Record medium",
        ok ? "Consistent record medium selected." : "Define and document record medium (digital/paper hybrid).",
        false,
      );
    },
  },
  {
    id: "record_access_controlled",
    category: "records",
    evaluate(ctx) {
      if (ctx.metadata?.recordsPolicyApplicable !== true) return null;
      const ok = ctx.metadata.recordAccessControlled === true;
      return r(
        "record_access_controlled",
        ok,
        ok ? "low" : "high",
        "REC_ACCESS",
        "Access control",
        ok ? "Access to records is role-controlled." : "Implement access control and audit trail for records.",
        !ok,
      );
    },
  },
  {
    id: "retention_period_defined",
    category: "records",
    evaluate(ctx) {
      if (ctx.metadata?.recordsPolicyApplicable !== true) return null;
      const ok = ctx.metadata.retentionPeriodDefined === true;
      return r(
        "retention_period_defined",
        ok,
        ok ? "low" : "medium",
        "REC_RETENTION",
        "Retention",
        ok ? "Retention periods documented." : "Define retention periods per record class.",
        false,
      );
    },
  },
  {
    id: "destruction_policy_defined",
    category: "records",
    evaluate(ctx) {
      if (ctx.metadata?.recordsPolicyApplicable !== true) return null;
      const ok = ctx.metadata.destructionPolicyDefined === true;
      return r(
        "destruction_policy_defined",
        ok,
        ok ? "low" : "medium",
        "REC_DESTROY_POLICY",
        "Destruction policy",
        ok ? "Secure destruction policy on file." : "Document privacy-safe destruction workflow.",
        false,
      );
    },
  },
  {
    id: "destruction_requires_secure_process",
    category: "records",
    evaluate(ctx) {
      if (ctx.metadata?.destructionEligible !== true) return null;
      const ok = ctx.metadata.destructionSecureProcessConfirmed === true;
      return r(
        "destruction_requires_secure_process",
        ok,
        ok ? "low" : "high",
        "REC_DESTROY_EXEC",
        "Secure destruction",
        ok ? "Destruction approved via secure process." : "Destruction requires secure, documented process.",
        !ok,
      );
    },
  },
];
