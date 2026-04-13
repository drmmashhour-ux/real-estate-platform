/**
 * BNHUB — static reference into the LECIPM Hub Engine registry.
 */

import { getHubConfig } from "@/lib/hub/core/hub-registry";

export const BNHUB_ENGINE_KEY = "bnhub" as const;

export function getBnhubEngineDefinition() {
  return getHubConfig(BNHUB_ENGINE_KEY);
}
