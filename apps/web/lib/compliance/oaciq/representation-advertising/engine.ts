import type {
  ComplianceRule,
  ListingAdvertisingComplianceContext,
  RepresentationAdvertisingEvaluation,
  RepresentationAdvertisingViolation,
} from "@/lib/compliance/oaciq/representation-advertising/types";
import { OACIQ_REPRESENTATION_ADVERTISING_RULES } from "@/lib/compliance/oaciq/representation-advertising/rules";

const RULE_BY_ID = new Map(OACIQ_REPRESENTATION_ADVERTISING_RULES.map((r) => [r.id, r]));

const GUARANTEE_RE =
  /\b(guaranteed\s+sale|garantie\s+de\s+vente|we\s+guarantee|sale\s+guaranteed|prix\s+garanti|100%\s+sold|vente\s+assurée|assuré\s+de\s+vendre)\b/i;

const REFERRAL_GIFT_RE =
  /\b(referral\s+(bonus|fee|gift)|gift\s+card.*referr|cash\s+back.*referr|prime\s+de\s+référence|récompense.*référence)\b/i;

function ruleMessage(rule: ComplianceRule): string {
  if (rule.required_action) {
    return `${rule.violation} — required: ${rule.required_action}`;
  }
  if (rule.prohibited_action) {
    return `${rule.violation} — prohibited: ${rule.prohibited_action}`;
  }
  return rule.violation;
}

function riskWeight(level: ComplianceRule["risk_level"]): number {
  if (level === "high") return 40;
  if (level === "medium") return 18;
  return 8;
}

function evaluateRule(rule: ComplianceRule, ctx: ListingAdvertisingComplianceContext): boolean {
  const pub = ctx.intendedForPublicAdvertising;
  const alwaysEvaluate = new Set([
    "respect_exclusive_contract",
    "no_performance_guarantee",
    "no_referral_gifts",
  ]);
  if (!pub && !alwaysEvaluate.has(rule.id)) {
    return false;
  }

  switch (rule.id) {
    case "license_required_for_advertising":
      return ctx.intendedForPublicAdvertising && !ctx.broker.holdsValidBrokerageLicense;

    case "mandatory_identity_in_advertising":
      return ctx.intendedForPublicAdvertising && !ctx.broker.licensedNameDisplayedInCreative;

    case "mandatory_designation":
      return ctx.intendedForPublicAdvertising && !ctx.broker.licenceDesignationPresent;

    case "respect_exclusive_contract":
      return ctx.broker.isSolicitingAnotherBrokersExclusive;

    case "no_referral_gifts":
      return ctx.broker.offersReferralGiftOrCommissionKickback || REFERRAL_GIFT_RE.test(ctx.marketingText);

    case "no_performance_guarantee":
      return GUARANTEE_RE.test(ctx.marketingText);

    case "contract_required_before_ad":
      return ctx.intendedForPublicAdvertising && !ctx.broker.hasSignedBrokerageContractForThisMandate;

    case "coming_soon_prohibited":
      return (
        ctx.isComingSoonOrTeaser &&
        !ctx.broker.hasSignedBrokerageContractForThisMandate &&
        ctx.intendedForPublicAdvertising
      );

    case "no_selling_price_display":
      return ctx.isSoldOrCompleted && ctx.publicAdShowsNumericPriceWhenSold && ctx.intendedForPublicAdvertising;

    case "sold_label_required":
      return ctx.isSoldOrCompleted && !ctx.displaysSoldLabel && ctx.intendedForPublicAdvertising;

    case "supervision_required":
      return ctx.broker.isAgencyOperation && !ctx.broker.agencyHasDocumentedSupervision;

    default:
      return false;
  }
}

/**
 * Run OACIQ representation / advertising rules (deterministic). Broker remains accountable for regulatory interpretation.
 */
export function runRepresentationAdvertisingEngine(
  ctx: ListingAdvertisingComplianceContext,
  ruleIds?: readonly string[],
): RepresentationAdvertisingEvaluation {
  const ids = ruleIds ?? OACIQ_REPRESENTATION_ADVERTISING_RULES.map((r) => r.id);
  const violations: RepresentationAdvertisingViolation[] = [];
  let risk_score = 0;

  for (const id of ids) {
    const rule = RULE_BY_ID.get(id);
    if (!rule) continue;
    if (evaluateRule(rule, ctx)) {
      violations.push({
        rule: rule.id,
        message: ruleMessage(rule),
        risk_level: rule.risk_level,
        category: rule.category,
      });
      risk_score += riskWeight(rule.risk_level);
    }
  }

  risk_score = Math.min(100, risk_score);
  const hasHigh = violations.some((v) => v.risk_level === "high");
  const blockPublish = hasHigh || risk_score >= 72;

  return {
    compliant: violations.length === 0,
    blockPublish,
    violations,
    risk_score,
    triggered_rule_ids: violations.map((v) => v.rule),
  };
}

export function validateListingAdvertisingCompliance(
  ctx: ListingAdvertisingComplianceContext,
  ruleIds?: readonly string[],
): RepresentationAdvertisingEvaluation {
  return runRepresentationAdvertisingEngine(ctx, ruleIds);
}
