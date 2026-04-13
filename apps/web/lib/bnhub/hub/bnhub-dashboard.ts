/**
 * BNHUB dashboard — sections resolved via registry + roles.
 */

import { getHubConfig } from "@/lib/hub/core/hub-registry";
import { resolveDashboardSections } from "@/lib/hub/core/hub-dashboard";
import { mapPlatformRoleToHubRoles } from "@/lib/hub/core/hub-permissions";
import { BNHUB_ENGINE_KEY } from "./bnhub-config";

export function resolveBnhubDashboardSections(platformRole: string | null | undefined) {
  const hub = getHubConfig(BNHUB_ENGINE_KEY);
  if (!hub) return [];
  const roles = mapPlatformRoleToHubRoles(platformRole);
  return resolveDashboardSections(hub, roles);
}
