import { getPhase7EnterpriseConfig } from "@/lib/trustgraph/config/phase7-enterprise";

export function defaultApprovalStepKinds(): string[] {
  return [...getPhase7EnterpriseConfig().documentApproval.defaultStepKinds];
}
