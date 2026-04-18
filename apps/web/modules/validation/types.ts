/**
 * LECIPM Full Platform Validation System v1 — shared types.
 */

export type RouteCategory =
  | "public"
  | "marketing"
  | "dashboard"
  | "admin"
  | "bnhub"
  | "listings"
  | "booking"
  | "auth"
  | "api"
  | "other";

export type DiscoveredRoute = {
  /** Filesystem pattern, e.g. `/[locale]/[country]/bnhub/page.tsx` */
  filePattern: string;
  /** Next.js path without locale/country substitution */
  pathTemplate: string;
  category: RouteCategory;
  /** True if path contains dynamic segments we cannot probe without real IDs */
  hasDynamicSegments: boolean;
  /** Example URL with defaults (may include placeholders) */
  exampleUrl?: string;
};

export type PageValidationStatus = "pass" | "fail" | "skip" | "warn";

export type PageValidationResult = {
  route: string;
  status: PageValidationStatus;
  httpStatus?: number;
  errors: string[];
  warnings: string[];
  loadTimeMs?: number;
  evidence?: Record<string, unknown>;
};

export type ApiCheckResult = {
  name: string;
  method: string;
  path: string;
  status: PageValidationStatus;
  expectedMin?: number;
  expectedMax?: number;
  httpStatus?: number;
  errors: string[];
  warnings: string[];
  responseTimeMs?: number;
};

export type SecurityCheckResult = {
  name: string;
  status: PageValidationStatus;
  errors: string[];
  warnings: string[];
  evidence?: Record<string, unknown>;
};

export type ScenarioStepResult = {
  name: string;
  ok: boolean;
  detail?: string;
  ms?: number;
};

export type ScenarioResult = {
  id: string;
  label: string;
  status: PageValidationStatus;
  steps: ScenarioStepResult[];
  errors: string[];
  warnings: string[];
};

export type LaunchDecision = "GO" | "GO_WITH_WARNINGS" | "NO_GO";

export type LaunchDecisionReport = {
  decision: LaunchDecision;
  reasons: string[];
  blockers: string[];
  warnings: string[];
};

export type PlatformValidationReportV1 = {
  meta: {
    version: "lecipm-platform-validation-v1";
    generatedAt: string;
    baseUrl: string;
    hostname?: string;
    mode: "full" | "smoke" | "offline";
    evidenceNote: string;
  };
  routeMapSummary: {
    totalDiscovered: number;
    categories: Partial<Record<RouteCategory, number>>;
  };
  launchEvents: {
    ran: boolean;
    ready: boolean;
    counts: Record<string, number>;
    issues: string[];
  };
  pages: PageValidationResult[];
  apis: ApiCheckResult[];
  security: SecurityCheckResult[];
  scenarios: ScenarioResult[];
  stripeBooking: {
    ran: boolean;
    ok: boolean;
    detail?: string;
  };
  dataIntegrity: {
    ran: boolean;
    ok: boolean;
    issues: string[];
    scanned?: number;
  };
  performance: {
    pageP95Ms?: number;
    apiP95Ms?: number;
    slowWarnings: string[];
  };
  launch: LaunchDecisionReport;
};
