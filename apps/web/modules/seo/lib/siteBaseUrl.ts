import { getPublicAppUrl } from "@/lib/config/public-app-url";

/** Canonical site origin for sitemaps, JSON-LD, and meta URLs. */
export function getSiteBaseUrl(): string {
  return getPublicAppUrl();
}
