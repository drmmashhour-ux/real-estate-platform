/**
 * BNHub search configuration — sourced from hub registry for a single source of truth.
 */

import { getHubConfig } from "@/lib/hub/core/hub-registry";
import { getSearchConfig } from "@/lib/hub/core/hub-search";
import { BNHUB_ENGINE_KEY } from "./bnhub-config";

export function getBnhubSearchConfig() {
  const hub = getHubConfig(BNHUB_ENGINE_KEY);
  if (!hub) return null;
  return getSearchConfig(hub);
}
