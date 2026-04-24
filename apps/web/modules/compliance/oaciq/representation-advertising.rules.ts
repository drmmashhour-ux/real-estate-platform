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

export const representationAdvertisingRules: ComplianceRule[] = [
  {
    id: "license_required_for_promotion",
    category: "representation",
    evaluate(ctx) {
      if (ctx.transactionType !== "advertising" && !ctx.advertising?.active) return null;
      const lic = ctx.advertising?.holdsValidLicense === true;
      return r(
        "license_required_for_promotion",
        lic,
        lic ? "low" : "critical",
        "LICENSE_PROMOTION",
        "Valid licence before promotion",
        lic ? "Brokerage licence validated for promotional activity." : "Promotion requires a valid OACIQ licence path.",
        !lic,
      );
    },
  },
  {
    id: "advertising_requires_signed_contract",
    category: "advertising",
    evaluate(ctx) {
      if (!ctx.advertising?.active) return null;
      const ok = ctx.advertising.signedBrokerageContractPresent;
      return r(
        "advertising_requires_signed_contract",
        ok,
        ok ? "low" : "critical",
        "ADV_CONTRACT",
        "Signed brokerage contract",
        ok
          ? "Mandate contract present before public advertising."
          : "Public advertising of a property requires an appropriate signed brokerage contract.",
        !ok,
        ok ? undefined : ["Obtain signed mandate", "Hold in compliance file"],
      );
    },
  },
  {
    id: "advertising_required_statements_present",
    category: "advertising",
    evaluate(ctx) {
      if (!ctx.advertising?.active) return null;
      const ok = ctx.advertising.containsRequiredStatements;
      return r(
        "advertising_required_statements_present",
        ok,
        ok ? "low" : "high",
        "ADV_STATEMENTS",
        "Required identification statements",
        ok ? "Required representation statements present." : "Add mandatory identification and licence statements.",
        !ok,
      );
    },
  },
  {
    id: "advertising_not_misleading",
    category: "advertising",
    evaluate(ctx) {
      if (!ctx.advertising?.active) return null;
      const bad = ctx.advertising.containsMisleadingClaims;
      return r(
        "advertising_not_misleading",
        !bad,
        bad ? "critical" : "low",
        "ADV_MISLEADING",
        "No misleading advertising",
        bad
          ? "Remove or correct false, incomplete, or confusing claims before publication."
          : "No misleading indicators flagged in copy review.",
        bad,
      );
    },
  },
  {
    id: "no_sold_price_disclosure",
    category: "advertising",
    evaluate(ctx) {
      if (!ctx.advertising?.active) return null;
      const bad = ctx.advertising.mentionsSoldPrice;
      return r(
        "no_sold_price_disclosure",
        !bad,
        bad ? "critical" : "low",
        "ADV_SOLD_PRICE",
        "Sold price prohibition",
        bad
          ? "Completed transaction advertising must not reveal selling price contrary to rules."
          : "Sold price not disclosed in creative.",
        bad,
      );
    },
  },
  {
    id: "no_improper_performance_guarantee",
    category: "advertising",
    evaluate(ctx) {
      if (!ctx.advertising?.active) return null;
      const bad = ctx.advertising.mentionsGuarantee;
      return r(
        "no_improper_performance_guarantee",
        !bad,
        bad ? "high" : "low",
        "ADV_GUARANTEE",
        "Performance guarantees",
        bad ? "Remove prohibited guarantee or performance language." : "No improper guarantee language detected.",
        false,
      );
    },
  },
  {
    id: "coming_soon_gated",
    category: "advertising",
    evaluate(ctx) {
      if (!ctx.advertising?.active || !ctx.advertising.isComingSoonOrPreMarket) return null;
      const ok = ctx.advertising.comingSoonAllowed === true && ctx.advertising.signedBrokerageContractPresent;
      return r(
        "coming_soon_gated",
        ok,
        ok ? "low" : "critical",
        "ADV_COMING_SOON",
        "Pre-market / coming soon",
        ok
          ? "Coming soon content permitted under current mandate and policy."
          : "Block coming soon / pre-market content until mandate and conditions are satisfied.",
        !ok,
      );
    },
  },
  {
    id: "solicitation_exclusive_contract_check",
    category: "representation",
    evaluate(ctx) {
      if (ctx.transactionType !== "client_solicitation" && !ctx.advertising?.active) return null;
      if (!ctx.advertising?.solicitationConflictsWithExclusive) return null;
      const conflict = ctx.advertising.solicitationConflictsWithExclusive;
      return r(
        "solicitation_exclusive_contract_check",
        !conflict,
        conflict ? "critical" : "low",
        "SOLICIT_EXCLUSIVE",
        "Exclusive brokerage conflict",
        conflict
          ? "Solicitation appears incompatible with an existing exclusive brokerage contract — stop and review."
          : "No exclusive contract conflict flagged.",
        conflict,
        conflict ? ["Verify mandate chain", "Log campaign scope"] : undefined,
      );
    },
  },
  {
    id: "promotion_referral_benefit_review",
    category: "representation",
    evaluate(ctx) {
      if (!ctx.advertising?.referralBenefitPresent) return null;
      const reviewed = ctx.metadata?.promotionReferralReviewed === true;
      return r(
        "promotion_referral_benefit_review",
        reviewed,
        reviewed ? "low" : "medium",
        "PROMO_REFERRAL",
        "Referral benefits / inducements",
        reviewed
          ? "Referral benefit or promotion reviewed for inducement risk."
          : "Document compliance review for gifts, contests, or referral benefits.",
        false,
        reviewed ? undefined : ["Compliance review note", "Retain campaign archive"],
      );
    },
  },
];
