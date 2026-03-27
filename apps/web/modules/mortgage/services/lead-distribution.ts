/**
 * Mortgage lead assignment — re-exports the smart routing engine.
 * @see ./leadRouting.ts
 */
export {
  assignMortgageBrokerForLead,
  computeLeadRoutingScore,
  PREMIUM_PRIORITY_BOOST,
  RECENT_ASSIGNMENT_WINDOW_MS,
} from "@/modules/mortgage/services/leadRouting";
export type { AssignMortgageBrokerResult, DistributionReason } from "@/modules/mortgage/services/leadRouting";
