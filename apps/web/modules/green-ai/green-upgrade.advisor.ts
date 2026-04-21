import type { GreenEngineInput, GreenImprovement } from "@/modules/green/green.types";
import type { GreenUpgradePlanItem } from "./green.types";
import { greenAiLog } from "./green-ai-logger";
import { findEligibleGrants } from "./grants/grants.engine";

function impactToPriority(impact: GreenImprovement["impact"]): GreenUpgradePlanItem["priority"] {
  if (impact === "HIGH") return "HIGH";
  if (impact === "MEDIUM") return "MEDIUM";
  return "LOW";
}

/** Maps engine improvements to roadmap rows; attaches illustrative grants per recommendation when `property` is provided. */
export function buildGreenUpgradePlan(
  improvements: GreenImprovement[],
  property?: GreenEngineInput,
  grantsBundle?: ReturnType<typeof findEligibleGrants>,
): GreenUpgradePlanItem[] {
  const bundle =
    property !== undefined
      ? (grantsBundle ?? findEligibleGrants({ property, plannedUpgrades: improvements }))
      : undefined;
  const grantsByAction =
    bundle !== undefined ? new Map(bundle.byRecommendation.map((x) => [x.action, x.grants])) : null;

  const plan = improvements.map((i) => ({
    action: i.action,
    costEstimate: i.estimatedCostLabel,
    scoreImpact: Math.round(i.expectedGainPoints * 0.85),
    priority: impactToPriority(i.impact),
    ...(grantsByAction !== null ? { grants: grantsByAction.get(i.action) ?? [] } : {}),
  }));
  greenAiLog.info("upgrade_plan_built", { rows: plan.length, grantsLayer: grantsByAction !== null });
  return plan;
}
