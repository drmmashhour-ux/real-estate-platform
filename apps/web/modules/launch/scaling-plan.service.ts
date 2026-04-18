/**
 * Scaling narrative for growth ops — wraps `buildScalePlan` with launch context.
 */
import { buildScalePlan, type ScalePlanPayload } from "@/modules/ads/ads-strategy.service";

export type ScalingPlanDocument = {
  summary: string;
  plan: ScalePlanPayload;
  operatorRitual: string[];
};

export function buildScalingPlanDocument(): ScalingPlanDocument {
  const plan = buildScalePlan();
  return {
    summary:
      "Scale only when tracking is trustworthy: UTMs on all paid landings, MI funnel events firing, CRM lead quality reviewed weekly.",
    plan,
    operatorRitual: [
      "Monday: review cost/lead + creative quartiles.",
      "Wednesday: negatives + placement review.",
      "Friday: duplicate lead audit + broker follow-ups.",
    ],
  };
}

export { buildScalePlan, type ScalePlanPayload } from "@/modules/ads/ads-strategy.service";
