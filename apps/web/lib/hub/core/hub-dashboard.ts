/**
 * Dashboard section resolution for hub shells.
 */

import type { HubDashboardSectionDef, HubDefinition, HubRole } from "./hub-types";
import { filterDashboardSectionsForViewer } from "./hub-permissions";

export function resolveDashboardSections(hub: HubDefinition, roles: HubRole[]): HubDashboardSectionDef[] {
  return filterDashboardSectionsForViewer(hub, roles);
}
