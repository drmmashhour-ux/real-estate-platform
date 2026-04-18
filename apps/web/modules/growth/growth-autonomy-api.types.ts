/**
 * GET /api/growth/autonomy response shape.
 */

import type { GrowthAutonomyMonitoringState } from "./growth-autonomy-monitoring.service";
import type { GrowthAutonomySnapshot } from "./growth-autonomy.types";

export type GrowthAutonomyGetResponse =
  | GrowthAutonomyDisabledResponse
  | GrowthAutonomyGatedResponse
  | GrowthAutonomyOkResponse;

export type GrowthAutonomyDisabledResponse = {
  autonomyLayerEnabled: false;
  killSwitchActive: boolean;
  operatorMessage: string;
  snapshot: null;
  internalGateBlocked?: false;
};

/** Internal rollout — production non-admin cannot load snapshot unless debug bypass. */
export type GrowthAutonomyGatedResponse = {
  autonomyLayerEnabled: true;
  internalGateBlocked: true;
  operatorMessage: string;
  snapshot: null;
  operationalMonitoring?: GrowthAutonomyMonitoringState;
};

export type GrowthAutonomyOkResponse = {
  autonomyLayerEnabled: true;
  internalGateBlocked: false;
  snapshot: GrowthAutonomySnapshot;
  operationalMonitoring?: GrowthAutonomyMonitoringState;
};
