import { offlineCacheGet, offlineCacheSet } from "./offline-cache.service";

const KEY = "broker_actions_cache_v1";

export function cacheBrokerActionsJson(json: string) {
  offlineCacheSet(KEY, json);
}

export function readCachedBrokerActionsJson(): string | undefined {
  return offlineCacheGet(KEY);
}
