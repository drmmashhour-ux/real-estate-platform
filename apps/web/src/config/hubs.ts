/**
 * LECIPM Hub Registry — central definition of every platform module.
 *
 * Every hub in the ecosystem is declared here. Navigation, routing, feature
 * gating, and access control derive from this single source of truth.
 *
 * Status lifecycle: coming_soon → beta → active → deprecated
 */

export type HubStatus = "active" | "beta" | "internal" | "coming_soon";

export type HubAudience =
  | "public"
  | "authenticated"
  | "broker"
  | "host"
  | "investor"
  | "admin"
  | "internal";

export type PlatformRole =
  | "VISITOR"
  | "USER"
  | "HOST"
  | "BROKER"
  | "MORTGAGE_EXPERT"
  | "DEVELOPER"
  | "ACCOUNTANT"
  | "ADMIN";

export interface HubDefinition {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: HubStatus;
  audience: HubAudience;
  primaryRoute: string;
  requiredRoles: PlatformRole[];
  featureFlag: string;
  navigationOrder: number;
  icon?: string;
}

export const PLATFORM_HUBS: readonly HubDefinition[] = [
  {
    id: "core",
    name: "LECIPM Core",
    slug: "core",
    description: "Auth, users, roles, account settings, platform shell, and shared infrastructure.",
    status: "active",
    audience: "public",
    primaryRoute: "/",
    requiredRoles: [],
    featureFlag: "FEATURE_CORE",
    navigationOrder: 0,
  },
  {
    id: "homes",
    name: "LECIPM Homes",
    slug: "homes",
    description: "Buying, selling, renting — long-term real estate marketplace with broker and FSBO flows.",
    status: "active",
    audience: "public",
    primaryRoute: "/homes",
    requiredRoles: [],
    featureFlag: "FEATURE_HOMES",
    navigationOrder: 1,
    icon: "🏠",
  },
  {
    id: "bnhub",
    name: "BNHub",
    slug: "bnhub",
    description: "Short-term stays marketplace — booking, hosting, reviews, and Stripe Connect payments.",
    status: "active",
    audience: "public",
    primaryRoute: "/bnhub",
    requiredRoles: [],
    featureFlag: "FEATURE_BNHUB",
    navigationOrder: 2,
    icon: "🛏️",
  },
  {
    id: "invest",
    name: "LECIPM Invest",
    slug: "invest",
    description: "ROI projections, rental assumptions, comps, portfolio dashboard, and investor alerts.",
    status: "beta",
    audience: "authenticated",
    primaryRoute: "/invest",
    requiredRoles: ["USER"],
    featureFlag: "FEATURE_INVEST",
    navigationOrder: 3,
    icon: "📊",
  },
  {
    id: "forms",
    name: "LECIPM Forms",
    slug: "forms",
    description: "Legal forms, OACIQ documents, seller declarations, e-signatures, and notary workflow.",
    status: "beta",
    audience: "authenticated",
    primaryRoute: "/forms",
    requiredRoles: ["USER"],
    featureFlag: "FEATURE_FORMS",
    navigationOrder: 4,
    icon: "📋",
  },
  {
    id: "immocontact",
    name: "ImmoContact",
    slug: "contact",
    description: "Communication hub — chat, AI assistant routing, broker assignment, lead scoring, follow-ups.",
    status: "active",
    audience: "public",
    primaryRoute: "/contact",
    requiredRoles: [],
    featureFlag: "FEATURE_IMMOCONTACT",
    navigationOrder: 5,
    icon: "💬",
  },
  {
    id: "dr-brain",
    name: "Dr Brain",
    slug: "admin/dr-brain",
    description: "Admin intelligence — system health, growth analytics, compliance health, fraud/risk alerts.",
    status: "internal",
    audience: "admin",
    primaryRoute: "/admin",
    requiredRoles: ["ADMIN"],
    featureFlag: "FEATURE_DR_BRAIN",
    navigationOrder: 6,
    icon: "🧠",
  },
  {
    id: "compliance",
    name: "Compliance Engine",
    slug: "compliance",
    description: "OACIQ/legal guardrails — compliance rules, publish gates, audit trail, risk severity.",
    status: "active",
    audience: "internal",
    primaryRoute: "/compliance",
    requiredRoles: ["BROKER", "ADMIN"],
    featureFlag: "FEATURE_COMPLIANCE",
    navigationOrder: 7,
    icon: "🛡️",
  },
  {
    id: "admin",
    name: "Admin",
    slug: "admin",
    description: "Platform administration — user management, settings, content moderation.",
    status: "active",
    audience: "admin",
    primaryRoute: "/admin",
    requiredRoles: ["ADMIN"],
    featureFlag: "FEATURE_DR_BRAIN",
    navigationOrder: 8,
    icon: "⚙️",
  },
  {
    id: "growth",
    name: "Growth",
    slug: "growth",
    description: "Marketing automation, SEO pages, growth analytics, user acquisition.",
    status: "active",
    audience: "internal",
    primaryRoute: "/growth",
    requiredRoles: ["ADMIN"],
    featureFlag: "FEATURE_GROWTH",
    navigationOrder: 9,
    icon: "📈",
  },
  {
    id: "design-system",
    name: "Design System",
    slug: "design",
    description: "Shared black/gold/white premium visual system — tokens, components, shells.",
    status: "active",
    audience: "internal",
    primaryRoute: "/dev/hub-atlas",
    requiredRoles: ["ADMIN"],
    featureFlag: "FEATURE_DESIGN_SYSTEM",
    navigationOrder: 10,
  },
] as const;

export type HubId = (typeof PLATFORM_HUBS)[number]["id"];

export function getHub(id: HubId): HubDefinition | undefined {
  return PLATFORM_HUBS.find((h) => h.id === id);
}

export function getActiveHubs(): HubDefinition[] {
  return PLATFORM_HUBS.filter((h) => h.status === "active" || h.status === "beta");
}

export function getPublicHubs(): HubDefinition[] {
  return PLATFORM_HUBS.filter(
    (h) => h.audience === "public" && (h.status === "active" || h.status === "beta")
  );
}

export function getHubBySlug(slug: string): HubDefinition | undefined {
  return PLATFORM_HUBS.find((h) => h.slug === slug);
}
