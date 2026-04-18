/**
 * Residential deal execution pipeline (assistive — broker-controlled). Steps align with Québec brokerage practice; not a legal checklist.
 */

export type ExecutionStepKey =
  | "promise_to_purchase"
  | "negotiation_counter"
  | "acceptance"
  | "conditions_tracking"
  | "mortgage_inspection"
  | "notary_coordination"
  | "closing";

export type ExecutionStep = {
  key: ExecutionStepKey;
  title: string;
  order: number;
  description: string;
};

export const RESIDENTIAL_EXECUTION_STEPS: ExecutionStep[] = [
  { key: "promise_to_purchase", order: 1, title: "Promise to purchase", description: "Draft / review PPG; official OACIQ publisher workflow applies." },
  { key: "negotiation_counter", order: 2, title: "Negotiation (CP loop)", description: "Counter-proposals until acceptance or withdrawal." },
  { key: "acceptance", order: 3, title: "Acceptance", description: "Binding agreement subject to conditions." },
  { key: "conditions_tracking", order: 4, title: "Conditions", description: "Financing, inspection, documents per accepted offer." },
  { key: "mortgage_inspection", order: 5, title: "Mortgage & inspection", description: "Lender / inspection outcomes recorded in the file." },
  { key: "notary_coordination", order: 6, title: "Notary", description: "Deed, adjustments, signing coordination." },
  { key: "closing", order: 7, title: "Closing", description: "Funds, keys, possession — file completeness review." },
];

export function resolveCurrentStepFromDealStatus(status: string): ExecutionStepKey {
  const s = status.toLowerCase();
  if (s === "closed") return "closing";
  if (s.includes("closing")) return "notary_coordination";
  if (s.includes("financ") || s.includes("inspect")) return "mortgage_inspection";
  if (s.includes("accept")) return "conditions_tracking";
  if (s.includes("offer") || s.includes("counter")) return "negotiation_counter";
  return "promise_to_purchase";
}
