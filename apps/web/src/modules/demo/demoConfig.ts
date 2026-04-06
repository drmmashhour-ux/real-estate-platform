/**
 * Investor demo mode — presentation layer only. Enable with DEMO_MODE_ENABLED=1.
 */
export const DEMO_MODE_ENV = "DEMO_MODE_ENABLED";
export const DEMO_SEEDED_DATA_ENV = "DEMO_MODE_USE_SEEDED_DATA";

/**
 * When true (default), `/demo/*` data layer uses only investor seed ids (LST-INVDEMO1/2, etc.).
 * Set `DEMO_MODE_USE_SEEDED_DATA=0` to opt out (not recommended for investor sessions).
 */
export const INVESTOR_DEMO_FORCE_SEEDED_DATA = true;

export type DemoStepKey =
  | "search"
  | "property"
  | "contact"
  | "booking"
  | "ops"
  | "revenue";

export const DEMO_STEP_ORDER: DemoStepKey[] = [
  "search",
  "property",
  "contact",
  "booking",
  "ops",
  "revenue",
];

export const DEMO_ROUTES: Record<DemoStepKey, string> = {
  search: "/demo/search",
  property: "/demo/property/bnhub",
  contact: "/demo/contact",
  booking: "/demo/booking",
  ops: "/demo/ops",
  revenue: "/demo/metrics",
};

/** Locked property URLs — search cards always link here (Continue flow stays on bnhub → contact). */
export const DEMO_PROPERTY_PATHS = {
  bnhub: "/demo/property/bnhub",
  resale: "/demo/property/resale",
} as const;

/**
 * Exact live investor demo order (presentation sequence).
 * 1 /demo → 2 /demo/search → 3 /demo/property/[id] → 4 /demo/contact → 5 /demo/booking → 6 /demo/ops → 7 /demo/metrics
 * Step 3 is always `/demo/property/bnhub` or `/demo/property/resale` (seeded LST-INVDEMO*). Continue always advances to /demo/contact even if the user opened another tab.
 */
export const DEMO_LIVE_PATH_ORDER = [
  "/demo",
  "/demo/search",
  "/demo/property/bnhub",
  "/demo/contact",
  "/demo/booking",
  "/demo/ops",
  "/demo/metrics",
] as const;

export const DEMO_LIVE_STEP_COUNT = DEMO_LIVE_PATH_ORDER.length;

function normalizeDemoPath(pathname: string): string {
  const p = pathname.replace(/\/$/, "") || "/demo";
  return p;
}

/** 1–7 for known demo paths; 0 if unknown. */
export function getLiveDemoStepIndex(pathname: string): number {
  const p = normalizeDemoPath(pathname);
  if (p === "/demo") return 1;
  if (p === "/demo/search") return 2;
  if (p.startsWith("/demo/property")) return 3;
  if (p === "/demo/contact") return 4;
  if (p === "/demo/booking") return 5;
  if (p === "/demo/ops") return 6;
  if (p === "/demo/metrics") return 7;
  return 0;
}

export function getNextLiveDemoPath(pathname: string): string | null {
  const p = normalizeDemoPath(pathname);
  if (p === "/demo") return "/demo/search";
  if (p === "/demo/search") return DEMO_ROUTES.property;
  if (p.startsWith("/demo/property")) return "/demo/contact";
  if (p === "/demo/contact") return "/demo/booking";
  if (p === "/demo/booking") return "/demo/ops";
  if (p === "/demo/ops") return "/demo/metrics";
  return null;
}

export function getPrevLiveDemoPath(pathname: string): string | null {
  const p = normalizeDemoPath(pathname);
  if (p === "/demo") return null;
  if (p === "/demo/search") return "/demo";
  if (p.startsWith("/demo/property")) return "/demo/search";
  if (p === "/demo/contact") return DEMO_ROUTES.property;
  if (p === "/demo/booking") return "/demo/contact";
  if (p === "/demo/ops") return "/demo/booking";
  if (p === "/demo/metrics") return "/demo/ops";
  return null;
}

/** Map URL path segment to step key for nav highlighting. */
export function pathToDemoStep(pathname: string): DemoStepKey | null {
  if (pathname === "/demo" || pathname === "/demo/") return null;
  if (pathname.startsWith("/demo/search")) return "search";
  if (pathname.startsWith("/demo/property")) return "property";
  if (pathname.startsWith("/demo/contact")) return "contact";
  if (pathname.startsWith("/demo/booking")) return "booking";
  if (pathname.startsWith("/demo/ops")) return "ops";
  if (pathname.startsWith("/demo/metrics")) return "revenue";
  return null;
}

export function readDemoModeEnabled(): boolean {
  const v = process.env[DEMO_MODE_ENV];
  return v === "1" || v === "true";
}

export function readUseSeededDemoDataFlag(): boolean {
  const v = process.env[DEMO_SEEDED_DATA_ENV];
  if (INVESTOR_DEMO_FORCE_SEEDED_DATA) {
    if (v === "0" || v === "false") return false;
    return true;
  }
  return v === "1" || v === "true";
}
