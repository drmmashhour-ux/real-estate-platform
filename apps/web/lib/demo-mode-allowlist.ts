/**
 * DEMO_MODE mutation allowlist — Edge-safe (no Prisma). Used by middleware.
 * See docs/DEMO_MODE_API_ROUTES.md
 */
type AllowRule = { path: string; methods?: string[] };

const DEMO_MODE_API_MUTATION_ALLOWLIST: AllowRule[] = [
  { path: "/api/auth/login", methods: ["POST"] },
  { path: "/api/auth/logout", methods: ["POST"] },
  { path: "/api/auth/staging-demo-login", methods: ["POST"] },
  { path: "/api/auth/demo-session", methods: ["POST"] },
  { path: "/api/auth/demo-login", methods: ["POST"] },
  { path: "/api/auth/password-reset", methods: ["POST"] },
  { path: "/api/admin/demo/generate-user", methods: ["POST"] },
  { path: "/api/feedback", methods: ["POST"] },
  { path: "/api/internal/demo-event", methods: ["POST"] },
  { path: "/api/cron/reset-demo", methods: ["GET", "POST"] },
  { path: "/api/admin/demo/reset", methods: ["POST"] },
  { path: "/api/demo/track", methods: ["POST"] },
  { path: "/api/demo/ai-help", methods: ["POST"] },
  /** Listing deal analyzer (read-only analysis). */
  { path: "/api/listings", methods: ["POST"] },
  /** Listing offer workflow (draft/submit/status/counter/notes). */
  { path: "/api/offers", methods: ["POST", "PATCH", "GET"] },
  { path: "/api/my/offers", methods: ["GET"] },
  { path: "/api/broker/offers", methods: ["GET"] },
  /** Broker CRM — clients, interactions, listings, status */
  { path: "/api/broker/clients", methods: ["GET", "POST", "PATCH", "DELETE"] },
  { path: "/api/broker/crm", methods: ["GET"] },
  /** Scheduling — availability, appointments */
  { path: "/api/broker/availability", methods: ["GET", "POST", "PATCH", "DELETE"] },
  { path: "/api/broker/appointments", methods: ["GET", "POST", "PATCH", "DELETE"] },
  { path: "/api/appointments", methods: ["GET", "POST", "PATCH", "DELETE"] },
  { path: "/api/my/appointments", methods: ["GET"] },
  /** In-app conversations + messages */
  { path: "/api/conversations", methods: ["GET", "POST"] },
  { path: "/api/messages", methods: ["PATCH", "DELETE"] },
  /** BNHub — search, listings, bookings, host flows (investor demo) */
  { path: "/api/bnhub", methods: ["GET", "POST", "PUT", "PATCH", "DELETE"] },
  /** Contracts — view + e-sign */
  { path: "/api/contracts", methods: ["GET", "POST", "PUT", "PATCH", "DELETE"] },
  /** Marketplace seller contract sign */
  { path: "/api/marketplace", methods: ["GET", "POST", "PUT", "PATCH", "DELETE"] },
  /** BNHub search UX — analytics + intent (safe, no payments) */
  { path: "/api/ai/activity", methods: ["POST"] },
  { path: "/api/ai/search", methods: ["GET", "POST"] },
];

function normalizeMethod(m: string): string {
  return m.toUpperCase();
}

export function isDemoModeApiMutationAllowed(pathname: string, method: string): boolean {
  const m = normalizeMethod(method);
  for (const rule of DEMO_MODE_API_MUTATION_ALLOWLIST) {
    if (pathname !== rule.path && !pathname.startsWith(`${rule.path}/`)) continue;
    if (rule.methods && !rule.methods.includes(m)) continue;
    return true;
  }
  return false;
}
