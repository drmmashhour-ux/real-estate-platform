/**
 * Fee helpers — re-exports BNHub education math + v1 engine.
 */
export {
  calculateBnhubLodgingFeeEducation,
  calculateHostPlanBookingFeeCents,
  describeHostPlanFee,
} from "@/modules/pricing-model/fee-calculator.service";

export { calculateBNHubPricing, calculateBrokerPricing } from "./pricing-engine.service";
export type { EnginePricingResult, FeeLine } from "./pricing-engine.service";
