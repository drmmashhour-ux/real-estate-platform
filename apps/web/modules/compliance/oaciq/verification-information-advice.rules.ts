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

export const verificationInformationAdviceRules: ComplianceRule[] = [
  {
    id: "material_information_verified",
    category: "verification",
    evaluate(ctx) {
      if (!ctx.metadata?.materialFactsReviewRequired) return null;
      const ok = ctx.metadata.materialInformationVerified === true;
      return r(
        "material_information_verified",
        ok,
        ok ? "low" : "high",
        "VERIFY_MATERIAL",
        "Material information",
        ok ? "Material facts verification documented." : "Verify and document material information before reliance.",
        !ok,
      );
    },
  },
  {
    id: "client_information_objective",
    category: "verification",
    evaluate(ctx) {
      if (!ctx.dealId && !ctx.listingId) return null;
      const ok = ctx.metadata?.clientInformationObjective !== false;
      return r(
        "client_information_objective",
        ok,
        ok ? "low" : "medium",
        "INFO_OBJECTIVE",
        "Objective information",
        ok ? "Information duties framed objectively." : "Present information without concealment; document sources.",
        false,
      );
    },
  },
  {
    id: "advice_documented",
    category: "verification",
    evaluate(ctx) {
      if (!ctx.metadata?.adviceEventOccurred) return null;
      const ok = ctx.metadata.adviceDocumented === true;
      return r(
        "advice_documented",
        ok,
        ok ? "low" : "medium",
        "ADVICE_DOC",
        "Advice documentation",
        ok ? "Advice to client is documented." : "Document professional advice provided to the client.",
        false,
      );
    },
  },
  {
    id: "inspection_recommended_when_required",
    category: "verification",
    evaluate(ctx) {
      if (!ctx.metadata?.inspectionRiskPresent) return null;
      const ok = ctx.metadata.inspectionRecommended === true || ctx.metadata.inspectionAcknowledged === true;
      return r(
        "inspection_recommended_when_required",
        ok,
        ok ? "low" : "medium",
        "INSPECTION_REC",
        "Inspection recommendation",
        ok
          ? "Inspection recommendation or client acknowledgment recorded."
          : "Provide inspection recommendation workflow and capture acknowledgment.",
        false,
        ok ? undefined : ["Send inspection advisory", "Log client decision"],
      );
    },
  },
  {
    id: "market_value_opinion_supported",
    category: "verification",
    evaluate(ctx) {
      if (!ctx.metadata?.marketValueOpinionOffered) return null;
      const ok = ctx.metadata.marketValueOpinionSupported === true;
      return r(
        "market_value_opinion_supported",
        ok,
        ok ? "low" : "medium",
        "MVO_SUPPORTED",
        "Market value opinion",
        ok ? "Value opinion supported by documented analysis." : "Support market value opinions with verifiable basis.",
        false,
      );
    },
  },
  {
    id: "legal_warranty_notice_reviewed",
    category: "verification",
    evaluate(ctx) {
      if (!ctx.metadata?.legalWarrantyExclusionsPresent) return null;
      const ok = ctx.metadata.legalWarrantyNoticeReviewed === true;
      return r(
        "legal_warranty_notice_reviewed",
        ok,
        ok ? "low" : "high",
        "LEGAL_WARRANTY",
        "Legal warranty disclosures",
        ok
          ? "Legal warranty / exclusion notices reviewed with client."
          : "Review legal warranty exclusions with client and log acknowledgment.",
        !ok,
        ok ? undefined : ["Disclosure checklist", "Client acknowledgment"],
      );
    },
  },
];
