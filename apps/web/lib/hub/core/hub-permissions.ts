/**
 * Hub-scoped permission resolution — roles come from platform + hub config.
 */

import type { HubDashboardSectionDef, HubDefinition, HubRole } from "./hub-types";

export function mapPlatformRoleToHubRoles(platformRole: string | null | undefined): HubRole[] {
  const r = (platformRole ?? "").toUpperCase();
  const out: HubRole[] = ["user"];
  if (r === "ADMIN") out.push("admin");
  if (r === "HOST") out.push("host");
  if (r === "BROKER") out.push("broker");
  if (r === "INVESTOR") out.push("investor");
  return out;
}

export function canViewDashboardSection(
  def: HubDashboardSectionDef,
  roles: HubRole[],
): boolean {
  if (!def.enabled) return false;
  if (!def.roles?.length) return true;
  return def.roles.some((role) => roles.includes(role));
}

export function filterDashboardSectionsForViewer(
  hub: HubDefinition,
  roles: HubRole[],
): HubDashboardSectionDef[] {
  return hub.dashboardSections
    .filter((s) => canViewDashboardSection(s, roles))
    .sort((a, b) => a.order - b.order);
}
