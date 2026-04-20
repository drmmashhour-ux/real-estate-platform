/**
 * Deterministic region resolution helpers — never throw; fall back to DEFAULT_PLATFORM_REGION_CODE.
 */

import type { PlatformRegionAppTarget, PlatformRegionCode } from "./region.types";
import { DEFAULT_PLATFORM_REGION_CODE, getRegionDefinition } from "./region-registry";

export type ResolveRegionFromCountryLocaleParams = {
  countryIso2?: string | null;
  locale?: string | null;
};

export function resolveRegionFromHost(hostname: string): PlatformRegionCode {
  const h = typeof hostname === "string" ? hostname.trim().toLowerCase() : "";
  if (!h) return DEFAULT_PLATFORM_REGION_CODE;
  if (h.includes("syria.") || h.startsWith("sy.") || h.includes(".sy.")) return "sy";
  if (h.includes("lecipm") && h.includes("qc")) return "ca_qc";
  return DEFAULT_PLATFORM_REGION_CODE;
}

export function resolveRegionFromPath(pathname: string): PlatformRegionCode {
  const p = typeof pathname === "string" ? pathname.trim().toLowerCase() : "";
  if (!p || p === "/") return DEFAULT_PLATFORM_REGION_CODE;
  const seg = p.split("/").filter(Boolean)[0] ?? "";
  if (seg === "sy" || seg === "syria") return "sy";
  if (seg === "qc" || seg === "quebec" || seg === "ca_qc") return "ca_qc";
  if (seg === "ca") return "ca_rest";
  return DEFAULT_PLATFORM_REGION_CODE;
}

export function resolveRegionFromCountryLocale(params: ResolveRegionFromCountryLocaleParams): PlatformRegionCode {
  const c = typeof params.countryIso2 === "string" ? params.countryIso2.trim().toUpperCase() : "";
  const loc = typeof params.locale === "string" ? params.locale.trim() : "";
  if (c === "SY") return "sy";
  if (c === "CA") {
    if (/fr[-_]?ca/i.test(loc) || /qc/i.test(loc)) return "ca_qc";
    return "ca_rest";
  }
  return DEFAULT_PLATFORM_REGION_CODE;
}

export function getDefaultAppTargetForRegion(regionCode: string): PlatformRegionAppTarget {
  const def = getRegionDefinition(regionCode);
  if (!def) return "web";
  return def.appTarget === "shared" ? "web" : def.appTarget;
}
