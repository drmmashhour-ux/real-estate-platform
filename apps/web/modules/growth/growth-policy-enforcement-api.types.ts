/**
 * HTTP contract for GET /api/growth/policy-enforcement (read-only).
 */

import type { GrowthPolicyEnforcementMonitoringState } from "./growth-policy-enforcement-monitoring.service";
import type { GrowthPolicyEnforcementSnapshot } from "./growth-policy-enforcement.types";

export type GrowthPolicyEnforcementDisabledResponse = {
  enforcementLayerEnabled: false;
  enforcementPanelFlagEnabled: boolean;
  advisoryScopeOnly: true;
  snapshot: null;
  operatorMessage: string;
};

export type GrowthPolicyEnforcementDebugPayload = {
  snapshotAvailable: boolean;
  notesCount: number;
  warningsCount: number;
};

export type GrowthPolicyEnforcementEnabledResponse = {
  enforcementLayerEnabled: true;
  enforcementPanelFlagEnabled: boolean;
  advisoryScopeOnly: true;
  snapshot: GrowthPolicyEnforcementSnapshot;
  /** In-process operational counters — only when client requested debug (see rollout doc). */
  operationalMonitoring?: GrowthPolicyEnforcementMonitoringState;
  debug?: GrowthPolicyEnforcementDebugPayload;
};

export type GrowthPolicyEnforcementGetResponse =
  | GrowthPolicyEnforcementDisabledResponse
  | GrowthPolicyEnforcementEnabledResponse;

export function isGrowthPolicyEnforcementEnabledResponse(
  j: GrowthPolicyEnforcementGetResponse,
): j is GrowthPolicyEnforcementEnabledResponse {
  return j.enforcementLayerEnabled === true;
}
