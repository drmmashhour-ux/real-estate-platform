/**
 * BNHUB AI capability flags — align with host autopilot + conversion + trust stack.
 */

import { getHubConfig } from "@/lib/hub/core/hub-registry";
import { BNHUB_ENGINE_KEY } from "./bnhub-config";

export function getBnhubAiCapabilities() {
  return getHubConfig(BNHUB_ENGINE_KEY)?.ai ?? null;
}
