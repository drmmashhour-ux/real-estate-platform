import { flags } from "@/lib/flags";

/** `?demo=high_demand` | `?demo=low_conversion` | `?demo=growth_surge` (Order 61). */
export type DemoScenarioId = "default" | "high_demand" | "low_conversion" | "growth_surge";

const DEMO_LISTING_PREFIX = "demo-";

/**
 * In-memory or URL-only scenario; does not enable demo by itself.
 */
export function parseDemoScenarioFromRequest(req: Request): DemoScenarioId {
  const raw = new URL(req.url).searchParams.get("demo")?.trim().toLowerCase() ?? "";
  if (raw === "high_demand" || raw === "scenario1") return "high_demand";
  if (raw === "low_conversion" || raw === "scenario2") return "low_conversion";
  if (raw === "growth_surge" || raw === "scenario3") return "growth_surge";
  return "default";
}

function cookieEnablesDemo(req: Request): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (!flags.DEMO_MODE_CLIENT_COOKIE) return false;
  const c = req.headers.get("cookie") ?? "";
  return /(?:^|;\s*)lecipm_demo=1(?:;|$)/.test(c);
}

/** Admin runtime toggle — independent from Syria demo flags. */
function lecipmRuntimeDemoEnabled(): boolean {
  return process.env.LECIPM_DEMO_MODE_RUNTIME === "true";
}

/**
 * **GET-only** paths may return the read-only demo dataset. Never use for write authorization alone.
 * - `FEATURE_DEMO_MODE=1` (and in production, `FEATURE_DEMO_MODE_PROD=1`)
 * - **or** (non-production + `FEATURE_DEMO_MODE_CLIENT=1` + `lecipm_demo=1` cookie for admin preview)
 */
export function isDemoDataActive(req: Request): boolean {
  if (lecipmRuntimeDemoEnabled()) return true;
  if (cookieEnablesDemo(req)) return true;
  if (!flags.DEMO_MODE) return false;
  if (process.env.NODE_ENV === "production" && !flags.DEMO_MODE_PROD) {
    return false;
  }
  return true;
}

export function isDemoListingId(id: string | null | undefined): boolean {
  return typeof id === "string" && id.startsWith(DEMO_LISTING_PREFIX);
}
