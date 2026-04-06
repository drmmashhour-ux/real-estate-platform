/**
 * LECIPM Hub Engine — core types (domain-agnostic contracts).
 * BNHub and future hubs implement adapters against these shapes.
 */

export type HubStatus = "enabled" | "beta" | "disabled" | "internal";

export type HubBookingMode =
  | "none"
  | "overnight_stay"
  | "daily_rental"
  | "appointment"
  | "order"
  | "transaction";

export type HubPricingMode = "none" | "nightly" | "daily" | "fixed" | "quote" | "hybrid";

export type HubMessagingMode = "none" | "thread" | "booking_scoped" | "crm";

export type HubDesignVariant = "lecipm_premium" | "lecipm_minimal";

export type HubEntityType = "listing" | "vehicle" | "service" | "deal" | "portfolio" | "custom";

export type HubDashboardSectionId =
  | "overview"
  | "items"
  | "bookings"
  | "calendar"
  | "messages"
  | "revenue"
  | "ai"
  | "operations";

export type HubRole = "guest" | "user" | "host" | "operator" | "broker" | "investor" | "admin";

export type HubFeatureFlags = {
  search: boolean;
  booking: boolean;
  payments: boolean;
  messaging: boolean;
  calendar: boolean;
  autopilot: boolean;
  aiRecommendations: boolean;
  analytics: boolean;
};

export type HubAiCapabilities = {
  hostAutopilot: boolean;
  guestMessagingAutomation: boolean;
  pricingOptimization: boolean;
  conversionOptimization: boolean;
  fraudDisputePrevention: boolean;
  loyaltyIntegration: boolean;
};

export type HubNavItemDef = {
  /** i18n key or literal English fallback */
  labelKey: string;
  href: string;
  icon?: string;
  roles?: HubRole[];
};

export type HubSearchFilterDef = {
  id: string;
  /** i18n key */
  labelKey: string;
  type: "string" | "date_range" | "number" | "select" | "boolean";
  queryParam: string;
  optional?: boolean;
};

export type HubSearchConfig = {
  defaultSort: string;
  allowedSorts: string[];
  filters: HubSearchFilterDef[];
  cardFields: string[];
  detailFields: string[];
};

export type HubDashboardSectionDef = {
  id: HubDashboardSectionId;
  labelKey: string;
  enabled: boolean;
  /** Order in shell; lower first */
  order: number;
  roles?: HubRole[];
};

export type HubDefinition = {
  key: string;
  labelKey: string;
  descriptionKey: string;
  icon: string;
  routeBase: string;
  status: HubStatus;
  designVariant: HubDesignVariant;
  bookingMode: HubBookingMode;
  pricingMode: HubPricingMode;
  messagingMode: HubMessagingMode;
  entityType: HubEntityType;
  features: HubFeatureFlags;
  ai: HubAiCapabilities;
  navigation: HubNavItemDef[];
  dashboardSections: HubDashboardSectionDef[];
  search: HubSearchConfig;
  /** Show in the global hub switcher (desktop shell). */
  showInSwitcher: boolean;
  /** Optional legacy theme key for getHubTheme() compatibility */
  themeKey: string;
};

export type HubRouteContext = {
  hubKey: string;
  pathname: string;
  segments: string[];
};

export type HubMessagingMilestoneId =
  | "request_received"
  | "confirmed"
  | "pre_start"
  | "in_progress"
  | "completed"
  | "post_completion";
