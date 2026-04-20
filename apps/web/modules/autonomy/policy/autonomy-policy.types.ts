import type { AutonomyDomain, AutonomyPolicyResult } from "../types/autonomy.types";

export interface AutonomyPolicyContext {
  mode: "OFF" | "ASSIST" | "SAFE_AUTOPILOT" | "FULL_AUTOPILOT_APPROVAL";
  domain: AutonomyDomain;
  actorRole?: string;
  entityId?: string;
  payload?: Record<string, unknown>;
  estimatedImpact?: {
    revenue?: number;
    occupancy?: number;
    costSavings?: number;
    riskReduction?: number;
  };
}

export interface AutonomyPolicyEvaluationResult {
  results: AutonomyPolicyResult[];
  allowed: boolean;
  requiresHumanApproval: boolean;
}
