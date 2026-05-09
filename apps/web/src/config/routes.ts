/**
 * LECIPM Route Registry — canonical route definitions by hub.
 *
 * All navigation links derive from this config, not hardcoded paths.
 * Routes use [locale] prefix in production (handled by next-intl middleware).
 */

export interface RouteDefinition {
  path: string;
  label: string;
  labelFr: string;
  hub: string;
  requiresAuth: boolean;
  requiresRole?: string[];
  isPublic: boolean;
}

export const PLATFORM_ROUTES: readonly RouteDefinition[] = [
  // ─── Core ───
  { path: "/", label: "Home", labelFr: "Accueil", hub: "core", requiresAuth: false, isPublic: true },
  { path: "/login", label: "Sign In", labelFr: "Connexion", hub: "core", requiresAuth: false, isPublic: true },
  { path: "/register", label: "Sign Up", labelFr: "Inscription", hub: "core", requiresAuth: false, isPublic: true },
  { path: "/about-platform", label: "About", labelFr: "À propos", hub: "core", requiresAuth: false, isPublic: true },

  // ─── Homes ───
  { path: "/search", label: "Search", labelFr: "Recherche", hub: "homes", requiresAuth: false, isPublic: true },
  { path: "/properties", label: "Properties", labelFr: "Propriétés", hub: "homes", requiresAuth: false, isPublic: true },
  { path: "/marketplace", label: "Marketplace", labelFr: "Marché", hub: "homes", requiresAuth: false, isPublic: true },
  { path: "/sell", label: "Sell", labelFr: "Vendre", hub: "homes", requiresAuth: true, isPublic: false },
  { path: "/mortgage", label: "Mortgage", labelFr: "Hypothèque", hub: "homes", requiresAuth: false, isPublic: true },

  // ─── BNHub ───
  { path: "/bnhub", label: "BNHub", labelFr: "BNHub", hub: "bnhub", requiresAuth: false, isPublic: true },
  { path: "/bnhub/stays", label: "Stays", labelFr: "Séjours", hub: "bnhub", requiresAuth: false, isPublic: true },
  { path: "/bnhub/login", label: "BNHub Login", labelFr: "Connexion BNHub", hub: "bnhub", requiresAuth: false, isPublic: true },
  { path: "/bnhub/host/dashboard", label: "Host Dashboard", labelFr: "Tableau de bord hôte", hub: "bnhub", requiresAuth: true, requiresRole: ["HOST"], isPublic: false },

  // ─── Invest ───
  { path: "/invest", label: "Invest", labelFr: "Investir", hub: "invest", requiresAuth: true, isPublic: false },

  // ─── Forms ───
  { path: "/forms", label: "Forms", labelFr: "Formulaires", hub: "forms", requiresAuth: true, isPublic: false },

  // ─── ImmoContact ───
  { path: "/contact", label: "Contact", labelFr: "Contact", hub: "immocontact", requiresAuth: false, isPublic: true },

  // ─── Admin / Dr Brain ───
  { path: "/admin", label: "Admin", labelFr: "Admin", hub: "dr-brain", requiresAuth: true, requiresRole: ["ADMIN"], isPublic: false },
  { path: "/broker", label: "Broker", labelFr: "Courtier", hub: "dr-brain", requiresAuth: true, requiresRole: ["BROKER"], isPublic: false },
  { path: "/owner", label: "Owner", labelFr: "Propriétaire", hub: "dr-brain", requiresAuth: true, requiresRole: ["HOST"], isPublic: false },

  // ─── Growth ───
  { path: "/growth", label: "Growth", labelFr: "Croissance", hub: "growth", requiresAuth: true, requiresRole: ["ADMIN"], isPublic: false },

  // ─── Compliance ───
  { path: "/compliance", label: "Compliance", labelFr: "Conformité", hub: "compliance", requiresAuth: true, requiresRole: ["ADMIN", "BROKER"], isPublic: false },
] as const;

export function getRoutesByHub(hubId: string): RouteDefinition[] {
  return PLATFORM_ROUTES.filter((r) => r.hub === hubId);
}

export function getPublicRoutes(): RouteDefinition[] {
  return PLATFORM_ROUTES.filter((r) => r.isPublic);
}

export function getRouteByPath(path: string): RouteDefinition | undefined {
  return PLATFORM_ROUTES.find((r) => r.path === path);
}
