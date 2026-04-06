/**
 * LECIPM Hub Engine — central registry (source of truth for hub metadata).
 */

import type {
  HubDashboardSectionDef,
  HubDefinition,
  HubFeatureFlags,
  HubRouteContext,
} from "./hub-types";
import { carHubEnvEnabled, investorHubEnvEnabled, serviceHubEnvEnabled } from "./hub-config";
import type { HubTheme } from "../themes";
import { getHubTheme } from "../themes";

const registry = new Map<string, HubDefinition>();

function baseFeatures(over: Partial<HubFeatureFlags> = {}): HubFeatureFlags {
  return {
    search: true,
    booking: true,
    payments: true,
    messaging: true,
    calendar: true,
    autopilot: false,
    aiRecommendations: false,
    analytics: true,
    ...over,
  };
}

export function registerHub(def: HubDefinition): void {
  registry.set(def.key, def);
}

export function getHubConfig(hubKey: string): HubDefinition | undefined {
  return registry.get(hubKey);
}

export function listRegisteredHubKeys(): string[] {
  return [...registry.keys()].sort();
}

/** Hubs that are enabled for runtime operations (routing, APIs). */
export function listEnabledHubs(): HubDefinition[] {
  return [...registry.values()].filter((h) => h.status !== "disabled");
}

const SWITCHER_THEME_ORDER = ["bnhub", "broker", "carhub", "servicehub", "investorhub"] as const;

/** Theme keys for `getHubTheme` / HubSwitcher — stable UX order. */
export function listHubKeysForSwitcher(): string[] {
  const enabled = new Set(
    listEnabledHubs().filter((h) => h.showInSwitcher).map((h) => h.themeKey),
  );
  return SWITCHER_THEME_ORDER.filter((k) => enabled.has(k));
}

export function resolveHubFromRoute(pathname: string): HubDefinition | undefined {
  const p = pathname.replace(/\/+$/, "") || "/";
  for (const h of registry.values()) {
    const base = h.routeBase.replace(/\/+$/, "");
    if (p === base || p.startsWith(`${base}/`)) return h;
  }
  if (p.startsWith("/bnhub") || p.startsWith("/dashboard/bnhub") || p.startsWith("/search/bnhub")) {
    return registry.get("bnhub");
  }
  if (p.startsWith("/dashboard/broker")) return registry.get("broker");
  return undefined;
}

export function resolveHubTheme(hubKey: string): HubTheme {
  const c = getHubConfig(hubKey);
  return getHubTheme(c?.themeKey ?? hubKey);
}

export function resolveHubFeatures(hubKey: string) {
  return getHubConfig(hubKey)?.features;
}

export function parseHubRouteContext(pathname: string): HubRouteContext {
  const segments = pathname.split("/").filter(Boolean);
  const hub = resolveHubFromRoute(pathname);
  return {
    hubKey: hub?.key ?? "",
    pathname,
    segments,
  };
}

function section(
  id: HubDashboardSectionDef["id"],
  labelKey: string,
  order: number,
  enabled: boolean,
  roles?: HubDashboardSectionDef["roles"],
): HubDashboardSectionDef {
  return { id, labelKey, order, enabled, roles };
}

function initRegistry(): void {
  registerHub({
    key: "bnhub",
    labelKey: "hub.bnhub.label",
    descriptionKey: "hub.bnhub.description",
    icon: "building",
    routeBase: "/bnhub",
    status: "enabled",
    designVariant: "lecipm_premium",
    bookingMode: "overnight_stay",
    pricingMode: "nightly",
    messagingMode: "booking_scoped",
    entityType: "listing",
    features: baseFeatures({ autopilot: true, aiRecommendations: true }),
    ai: {
      hostAutopilot: true,
      guestMessagingAutomation: true,
      pricingOptimization: true,
      conversionOptimization: true,
      fraudDisputePrevention: true,
      loyaltyIntegration: true,
    },
    navigation: [
      { labelKey: "nav.dashboard", href: "/dashboard/bnhub" },
      { labelKey: "nav.find_stay", href: "/search/bnhub" },
      { labelKey: "nav.trips", href: "/bnhub/trips" },
      { labelKey: "nav.host", href: "/bnhub/host/dashboard" },
    ],
    dashboardSections: [
      section("overview", "hub.section.overview", 10, true),
      section("items", "hub.section.items", 20, true, ["host"]),
      section("bookings", "hub.section.bookings", 30, true),
      section("calendar", "hub.section.calendar", 40, true, ["host"]),
      section("messages", "hub.section.messages", 50, true),
      section("revenue", "hub.section.revenue", 60, true, ["host"]),
      section("ai", "hub.section.ai", 70, true, ["host"]),
      section("operations", "hub.section.operations", 80, true, ["host", "admin"]),
    ],
    search: {
      defaultSort: "recommended",
      allowedSorts: ["recommended", "priceAsc", "priceDesc", "newest"],
      filters: [
        { id: "city", labelKey: "filter.city", type: "string", queryParam: "city" },
        { id: "dates", labelKey: "filter.dates", type: "date_range", queryParam: "checkIn" },
        { id: "guests", labelKey: "filter.guests", type: "number", queryParam: "guests" },
        { id: "price", labelKey: "filter.price", type: "number", queryParam: "maxPrice" },
      ],
      cardFields: ["title", "city", "nightPrice", "rating", "photo"],
      detailFields: ["title", "description", "amenities", "rules", "map"],
    },
    showInSwitcher: true,
    themeKey: "bnhub",
  });

  registerHub({
    key: "carhub",
    labelKey: "hub.carhub.label",
    descriptionKey: "hub.carhub.description",
    icon: "car",
    routeBase: "/hub/carhub",
    status: carHubEnvEnabled() ? "beta" : "disabled",
    designVariant: "lecipm_premium",
    bookingMode: "daily_rental",
    pricingMode: "daily",
    messagingMode: "booking_scoped",
    entityType: "vehicle",
    features: baseFeatures({ autopilot: false, calendar: true }),
    ai: {
      hostAutopilot: false,
      guestMessagingAutomation: true,
      pricingOptimization: true,
      conversionOptimization: true,
      fraudDisputePrevention: true,
      loyaltyIntegration: false,
    },
    navigation: [{ labelKey: "nav.explore", href: "/hub/carhub" }],
    dashboardSections: [
      section("overview", "hub.section.overview", 10, true),
      section("items", "hub.section.items", 20, true, ["operator"]),
      section("bookings", "hub.section.bookings", 30, true),
      section("calendar", "hub.section.calendar", 40, true),
    ],
    search: {
      defaultSort: "priceAsc",
      allowedSorts: ["priceAsc", "priceDesc", "newest"],
      filters: [
        { id: "city", labelKey: "filter.city", type: "string", queryParam: "city" },
        { id: "dates", labelKey: "filter.dates", type: "date_range", queryParam: "from" },
      ],
      cardFields: ["make", "model", "price", "photo"],
      detailFields: ["specs", "location", "terms"],
    },
    showInSwitcher: carHubEnvEnabled(),
    themeKey: "carhub",
  });

  registerHub({
    key: "servicehub",
    labelKey: "hub.servicehub.label",
    descriptionKey: "hub.servicehub.description",
    icon: "wrench",
    routeBase: "/hub/servicehub",
    status: serviceHubEnvEnabled() ? "beta" : "disabled",
    designVariant: "lecipm_premium",
    bookingMode: "appointment",
    pricingMode: "quote",
    messagingMode: "thread",
    entityType: "service",
    features: baseFeatures({ payments: false, calendar: true }),
    ai: {
      hostAutopilot: false,
      guestMessagingAutomation: true,
      pricingOptimization: false,
      conversionOptimization: true,
      fraudDisputePrevention: false,
      loyaltyIntegration: false,
    },
    navigation: [{ labelKey: "nav.services", href: "/hub/servicehub" }],
    dashboardSections: [
      section("overview", "hub.section.overview", 10, true),
      section("bookings", "hub.section.bookings", 20, true),
    ],
    search: {
      defaultSort: "newest",
      allowedSorts: ["newest", "priceAsc"],
      filters: [{ id: "city", labelKey: "filter.city", type: "string", queryParam: "city" }],
      cardFields: ["title", "price"],
      detailFields: ["description"],
    },
    showInSwitcher: serviceHubEnvEnabled(),
    themeKey: "servicehub",
  });

  registerHub({
    key: "investorhub",
    labelKey: "hub.investorhub.label",
    descriptionKey: "hub.investorhub.description",
    icon: "chart",
    routeBase: "/hub/investorhub",
    status: investorHubEnvEnabled() ? "internal" : "disabled",
    designVariant: "lecipm_premium",
    bookingMode: "none",
    pricingMode: "none",
    messagingMode: "none",
    entityType: "portfolio",
    features: baseFeatures({
      search: false,
      booking: false,
      payments: false,
      messaging: false,
      calendar: false,
      analytics: true,
    }),
    ai: {
      hostAutopilot: false,
      guestMessagingAutomation: false,
      pricingOptimization: false,
      conversionOptimization: false,
      fraudDisputePrevention: false,
      loyaltyIntegration: false,
    },
    navigation: [{ labelKey: "nav.insights", href: "/hub/investorhub" }],
    dashboardSections: [
      section("overview", "hub.section.overview", 10, true, ["investor", "admin"]),
      section("revenue", "hub.section.revenue", 20, true, ["investor", "admin"]),
      section("ai", "hub.section.ai", 30, true, ["investor", "admin"]),
    ],
    search: {
      defaultSort: "newest",
      allowedSorts: [],
      filters: [],
      cardFields: [],
      detailFields: [],
    },
    showInSwitcher: investorHubEnvEnabled(),
    themeKey: "investorhub",
  });

  registerHub({
    key: "broker",
    labelKey: "hub.brokerhub.label",
    descriptionKey: "hub.brokerhub.description",
    icon: "briefcase",
    routeBase: "/dashboard/broker",
    status: "enabled",
    designVariant: "lecipm_premium",
    bookingMode: "transaction",
    pricingMode: "hybrid",
    messagingMode: "crm",
    entityType: "deal",
    features: baseFeatures({ autopilot: true, aiRecommendations: true }),
    ai: {
      hostAutopilot: false,
      guestMessagingAutomation: true,
      pricingOptimization: false,
      conversionOptimization: true,
      fraudDisputePrevention: true,
      loyaltyIntegration: false,
    },
    navigation: [{ labelKey: "nav.dashboard", href: "/dashboard/broker" }],
    dashboardSections: [
      section("overview", "hub.section.overview", 10, true, ["broker"]),
      section("messages", "hub.section.messages", 20, true, ["broker"]),
      section("calendar", "hub.section.calendar", 30, true, ["broker"]),
    ],
    search: {
      defaultSort: "newest",
      allowedSorts: ["newest"],
      filters: [],
      cardFields: [],
      detailFields: [],
    },
    showInSwitcher: true,
    themeKey: "broker",
  });
}

initRegistry();
