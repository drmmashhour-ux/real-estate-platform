/**
 * Discover Next.js App Router pages under `app/` and build a categorized route map.
 */
import { readdirSync, statSync } from "fs";
import { join, relative } from "path";
import type { DiscoveredRoute, RouteCategory } from "./types";

const APP_DIR = join(process.cwd(), "app");

function walkPageFiles(dir: string, out: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    const p = join(dir, name);
    let st: ReturnType<typeof statSync>;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walkPageFiles(p, out);
    } else if (name === "page.tsx" || name === "page.ts") {
      out.push(p);
    }
  }
}

function stripRouteGroups(segment: string): string | null {
  if (segment.startsWith("(") && segment.endsWith(")")) return null;
  return segment;
}

function categorize(pathTemplate: string): RouteCategory {
  const p = pathTemplate.toLowerCase();
  if (p.includes("/admin/")) return "admin";
  if (p.includes("/bnhub/") || p === "/bnhub" || p.endsWith("/bnhub")) return "bnhub";
  if (p.includes("/dashboard/") || p.includes("(dashboard)")) return "dashboard";
  if (p.includes("/auth/")) return "auth";
  if (p.includes("/listings") || p.includes("/listing")) return "listings";
  if (p.includes("/booking")) return "booking";
  if (p.includes("/blog") || p.includes("marketing")) return "marketing";
  if (p === "/" || p.includes("/sell") || p.includes("/pricing") || p.includes("/lp/")) return "marketing";
  return "public";
}

const DEFAULT_LOCALE = "en";
const DEFAULT_COUNTRY = "ca";

/**
 * Build a single example URL from a template like `/[locale]/[country]/foo/[id]`.
 * Dynamic segments without env samples return `hasDynamic=true` and may omit exampleUrl.
 */
function dynamicPartToKey(part: string): { kind: "locale" | "country" | "rest"; name: string } | null {
  if (!part.startsWith("[") || !part.endsWith("]")) return null;
  const inner = part.slice(1, -1);
  if (inner === "locale") return { kind: "locale", name: inner };
  if (inner === "country") return { kind: "country", name: inner };
  if (inner.startsWith("...")) return { kind: "rest", name: inner.slice(3) };
  return { kind: "rest", name: inner };
}

export function pathTemplateToExample(
  pathTemplate: string,
  samples: Record<string, string>,
): { url: string; hasUnsatisfiedDynamic: boolean } {
  const parts = pathTemplate.split("/").filter(Boolean);
  const out: string[] = [];
  let hasUnsatisfied = false;
  for (const part of parts) {
    const dyn = dynamicPartToKey(part);
    if (!dyn) {
      out.push(part);
      continue;
    }
    if (dyn.kind === "locale") {
      out.push(samples.locale ?? DEFAULT_LOCALE);
      continue;
    }
    if (dyn.kind === "country") {
      out.push(samples.country ?? DEFAULT_COUNTRY);
      continue;
    }

    const name = dyn.name;
    const val =
      name === "id"
        ? samples.id
        : name === "slug"
          ? samples.slug
          : name === "city"
            ? samples.city
            : name === "type"
              ? samples.type
              : samples[name];

    if (val && val.length > 0) {
      out.push(val);
    } else {
      hasUnsatisfied = true;
      out.push(`__missing_${name}__`);
    }
  }

  const url = `/${out.join("/")}`.replace(/\/+/g, "/");
  return { url, hasUnsatisfiedDynamic: hasUnsatisfied };
}

function filePathToTemplate(absFile: string): string {
  const rel = relative(APP_DIR, absFile).replace(/\\/g, "/");
  const withoutPage = rel.replace(/(^|\/)page\.tsx?$/, "");
  if (!withoutPage) return "/";
  const segments = withoutPage
    .split("/")
    .map(stripRouteGroups)
    .filter((s): s is string => Boolean(s));
  return segments.length ? `/${segments.join("/")}` : "/";
}

/**
 * Env-driven samples for dynamic segments (set in CI or local .env for probing).
 */
export function getDynamicRouteSamples(): Record<string, string> {
  return {
    locale: process.env.VALIDATION_LOCALE?.trim() || DEFAULT_LOCALE,
    country: process.env.VALIDATION_COUNTRY?.trim() || DEFAULT_COUNTRY,
    id:
      process.env.VALIDATION_SAMPLE_LISTING_ID?.trim() ||
      process.env.VALIDATION_SAMPLE_ID?.trim() ||
      "",
    slug: process.env.VALIDATION_SAMPLE_SLUG?.trim() || "welcome",
    city: process.env.VALIDATION_SAMPLE_CITY?.trim() || "montreal",
    type: process.env.VALIDATION_SAMPLE_AD_TYPE?.trim() || "google",
  };
}

export function discoverAllRoutes(): DiscoveredRoute[] {
  const files: string[] = [];
  walkPageFiles(APP_DIR, files);

  const samples = getDynamicRouteSamples();
  const routes: DiscoveredRoute[] = [];

  for (const f of files) {
    const pathTemplate = filePathToTemplate(f);
    const { url, hasUnsatisfiedDynamic } = pathTemplateToExample(pathTemplate, samples);
    const hasDynamic = pathTemplate.includes("[");
    const category = categorize(pathTemplate);

    routes.push({
      filePattern: relative(process.cwd(), f).replace(/\\/g, "/"),
      pathTemplate,
      category,
      hasDynamicSegments: hasDynamic,
      exampleUrl: hasUnsatisfiedDynamic ? undefined : url,
    });
  }

  routes.sort((a, b) => a.pathTemplate.localeCompare(b.pathTemplate));
  return routes;
}

export function summarizeRoutesByCategory(routes: DiscoveredRoute[]): Partial<Record<RouteCategory, number>> {
  const m: Partial<Record<RouteCategory, number>> = {};
  for (const r of routes) {
    m[r.category] = (m[r.category] ?? 0) + 1;
  }
  return m;
}
