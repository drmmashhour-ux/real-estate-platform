/**
 * LECIPM Navigation Config — derived from hub and route registries.
 *
 * Navigation items are generated from the hub registry, not hardcoded.
 * Use these in headers, mobile nav, footer, and hub switcher.
 */

import { getActiveHubs, getPublicHubs, type HubDefinition } from "./hubs";

export interface NavigationItem {
  hubId: string;
  label: string;
  labelFr: string;
  href: string;
  icon?: string;
  badge?: string;
}

/** Primary ecosystem navigation — visible to all visitors. */
export function getPrimaryNavigation(): NavigationItem[] {
  const publicHubs = getPublicHubs();
  return publicHubs
    .sort((a, b) => a.navigationOrder - b.navigationOrder)
    .map((hub) => ({
      hubId: hub.id,
      label: hub.name,
      labelFr: getHubLabelFr(hub),
      href: hub.primaryRoute,
      icon: hub.icon,
    }));
}

/** Authenticated hub switcher — shows all active hubs for the user's role. */
export function getHubSwitcherItems(userRoles: string[]): NavigationItem[] {
  const hubs: HubDefinition[] = getActiveHubs();
  return hubs
    .filter((hub) => {
      if (hub.requiredRoles.length === 0) return true;
      return hub.requiredRoles.some((r) => userRoles.includes(r));
    })
    .sort((a, b) => a.navigationOrder - b.navigationOrder)
    .map((hub) => ({
      hubId: hub.id,
      label: hub.name,
      labelFr: getHubLabelFr(hub),
      href: hub.primaryRoute,
      icon: hub.icon,
    }));
}

/** Footer navigation grouping. */
export const FOOTER_SECTIONS = [
  {
    title: "Platform",
    titleFr: "Plateforme",
    links: [
      { label: "Home", labelFr: "Accueil", href: "/" },
      { label: "About", labelFr: "À propos", href: "/about-platform" },
      { label: "Contact", labelFr: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Real Estate",
    titleFr: "Immobilier",
    links: [
      { label: "Search", labelFr: "Rechercher", href: "/search" },
      { label: "Marketplace", labelFr: "Marché", href: "/marketplace" },
      { label: "Mortgage", labelFr: "Hypothèque", href: "/mortgage" },
    ],
  },
  {
    title: "Short Stays",
    titleFr: "Séjours courts",
    links: [
      { label: "BNHub", labelFr: "BNHub", href: "/bnhub" },
      { label: "Stays", labelFr: "Séjours", href: "/bnhub/stays" },
    ],
  },
] as const;

function getHubLabelFr(hub: HubDefinition): string {
  const labels: Record<string, string> = {
    core: "LECIPM",
    homes: "Immobilier",
    bnhub: "BNHub",
    invest: "Investir",
    forms: "Formulaires",
    immocontact: "Contact",
    "dr-brain": "Dr Brain",
    compliance: "Conformité",
    "design-system": "Design",
  };
  return labels[hub.id] ?? hub.name;
}
