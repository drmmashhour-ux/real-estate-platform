import type { Deal } from "@prisma/client";

export type ContractWorkflowState =
  | "intake"
  | "drafting"
  | "broker_review"
  | "waiting_client_data"
  | "waiting_conditions"
  | "ready_for_export"
  | "exported"
  | "signed"
  | "archived";

/** Reads AI Contract Engine workflow state from deal row (assistive). */
export function getContractWorkflowState(deal: Deal): ContractWorkflowState | null {
  const s = deal.contractWorkflowState;
  if (!s) return null;
  return s as ContractWorkflowState;
}
