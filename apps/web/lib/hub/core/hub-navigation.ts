/**
 * Bridge registry navigation to existing `NavItem` shape for HubLayout.
 */

import type { NavItem } from "../navigation";
import { getHubConfig } from "./hub-registry";
import { resolveHubLabel } from "./hub-i18n";
import type { HubLocale } from "./hub-i18n";

export function hubEngineNavItems(hubKey: string, locale: HubLocale = "en"): NavItem[] {
  const h = getHubConfig(hubKey);
  if (!h) return [];
  return h.navigation.map((n) => ({
    label: resolveHubLabel(n.labelKey, locale),
    href: n.href,
  }));
}
