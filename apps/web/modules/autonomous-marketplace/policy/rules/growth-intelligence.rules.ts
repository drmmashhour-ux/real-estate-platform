/**
 * Growth Intelligence governance — deterministic, dry-run heavy, no outbound automation.
 */

import type { PolicyRuleEvaluation } from "../../types/domain.types";
import type { PolicyContext } from "../policy-context";

export const GROWTH_INTEL_DOMAIN = "growth_intelligence" as const;
export const growthIntelPublicPublishRuleCode = "growth_intel_public_publish_guard";
export const growthIntelHighValueTaskRuleCode = "growth_intel_high_value_internal_task";
export const growthIntelWeakDataRuleCode = "growth_intel_weak_data_advisory";

function metaBool(ctx: PolicyContext, key: string): boolean {
  const v = ctx.action.metadata?.[key];
  return v === true || v === "true";
}

function metaStr(ctx: PolicyContext, key: string): string | undefined {
  const v = ctx.action.metadata?.[key];
  return typeof v === "string" ? v : undefined;
}

/**
 * Blocks autonomous public publishing / messaging / spend — growth outputs remain drafts or advisory.
 */
export function evaluateGrowthIntelPublicPublishGuard(ctx: PolicyContext): PolicyRuleEvaluation {
  const publish = metaBool(ctx, "growthIntelPublicPublish");
  const externalMsg = metaBool(ctx, "growthIntelExternalMessage");
  const budget = metaBool(ctx, "growthIntelSpendBudget");

  if (publish || externalMsg || budget) {
    return {
      ruleCode: growthIntelPublicPublishRuleCode,
      result: "blocked",
      dispositionHint: "BLOCK",
      reason: "Growth Intelligence cannot auto-publish, auto-message externally, or adjust spend.",
      metadata: {
        domain: GROWTH_INTEL_DOMAIN,
        growthIntelPublicPublish: publish,
        growthIntelExternalMessage: externalMsg,
        growthIntelSpendBudget: budget,
      },
    };
  }

  return {
    ruleCode: growthIntelPublicPublishRuleCode,
    result: "passed",
    metadata: { domain: GROWTH_INTEL_DOMAIN },
  };
}

/**
 * High-value opportunities may create internal tasks — still advisory unless executor explicitly approved.
 */
/**
 * Low-confidence / sparse-data growth hints stay advisory — no autonomous execution surfaces.
 */
export function evaluateGrowthIntelWeakDataAdvisory(ctx: PolicyContext): PolicyRuleEvaluation {
  const growthIntel = metaBool(ctx, "growthIntel");
  if (!growthIntel) {
    return { ruleCode: growthIntelWeakDataRuleCode, result: "passed" };
  }

  const weak =
    metaBool(ctx, "growthIntelWeakData") || metaStr(ctx, "growthIntelConfidenceTier") === "low";

  if (weak) {
    return {
      ruleCode: growthIntelWeakDataRuleCode,
      result: "warning",
      dispositionHint: "ADVISORY_ONLY",
      reason:
        "Growth signal marked weak-data or low-confidence — internal advisory only; no autonomous execution.",
      metadata: {
        domain: GROWTH_INTEL_DOMAIN,
      },
    };
  }

  return {
    ruleCode: growthIntelWeakDataRuleCode,
    result: "passed",
    metadata: { domain: GROWTH_INTEL_DOMAIN },
  };
}

export function evaluateGrowthIntelHighValueInternalTask(ctx: PolicyContext): PolicyRuleEvaluation {
  const growthIntel = metaBool(ctx, "growthIntel");
  if (!growthIntel) {
    return { ruleCode: growthIntelHighValueTaskRuleCode, result: "passed" };
  }

  const tier = metaStr(ctx, "growthIntelPriorityTier");
  const complianceHeavy = metaBool(ctx, "growthIntelComplianceHeavy");

  if (complianceHeavy) {
    return {
      ruleCode: growthIntelHighValueTaskRuleCode,
      result: "warning",
      dispositionHint: "ALLOW_DRY_RUN",
      reason:
        "Compliance-heavy growth artifact — draft-only internally; governance review mandatory before publication.",
      metadata: {
        domain: GROWTH_INTEL_DOMAIN,
        tier,
        complianceHeavy: true,
      },
    };
  }

  if (tier === "urgent" || tier === "high") {
    return {
      ruleCode: growthIntelHighValueTaskRuleCode,
      result: "warning",
      dispositionHint: "ALLOW_WITH_APPROVAL",
      reason: "High-value growth signal — internal task draft allowed; execution requires approval.",
      metadata: { domain: GROWTH_INTEL_DOMAIN, tier },
    };
  }

  return {
    ruleCode: growthIntelHighValueTaskRuleCode,
    result: "passed",
    metadata: { domain: GROWTH_INTEL_DOMAIN },
  };
}
