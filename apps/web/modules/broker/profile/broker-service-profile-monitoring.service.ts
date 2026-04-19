/**
 * `[broker:profile]` — never throws.
 */

import { logInfo } from "@/lib/logger";

const LOG = "[broker:profile]";

export type BrokerServiceProfileMonitoringSnapshot = {
  profilesUpserted: number;
  profilesUpdatedEvents: number;
  routingRecommendationsUsedProfile: number;
  sparseProfileFallbacks: number;
};

let state: BrokerServiceProfileMonitoringSnapshot = {
  profilesUpserted: 0,
  profilesUpdatedEvents: 0,
  routingRecommendationsUsedProfile: 0,
  sparseProfileFallbacks: 0,
};

export function getBrokerServiceProfileMonitoringSnapshot(): BrokerServiceProfileMonitoringSnapshot {
  return { ...state };
}

export function resetBrokerServiceProfileMonitoringForTests(): void {
  state = {
    profilesUpserted: 0,
    profilesUpdatedEvents: 0,
    routingRecommendationsUsedProfile: 0,
    sparseProfileFallbacks: 0,
  };
}

export function recordBrokerServiceProfileUpsert(_brokerId: string): void {
  try {
    state.profilesUpserted += 1;
    logInfo(`${LOG} upsert`);
  } catch {
    /* noop */
  }
}

export function recordBrokerServiceProfileUpdated(kind: string): void {
  try {
    state.profilesUpdatedEvents += 1;
    logInfo(`${LOG} updated`, { kind });
  } catch {
    /* noop */
  }
}

export function recordRoutingUsedProfile(meta: { sparse: boolean }): void {
  try {
    state.routingRecommendationsUsedProfile += 1;
    if (meta.sparse) state.sparseProfileFallbacks += 1;
    logInfo(`${LOG} routing_profile_signal`, meta);
  } catch {
    /* noop */
  }
}
