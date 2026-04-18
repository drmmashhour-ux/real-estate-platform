/**
 * UTM capture for growth attribution — complements middleware first-touch cookie.
 * Reuses strict parsers from `modules/attribution/utm-parser`.
 */

import { parseUtmFromUrl, parseUtmFromSearchParams, type UtmPayload } from "@/modules/attribution/utm-parser";

export type { UtmPayload };

export { parseUtmFromUrl, parseUtmFromSearchParams };

const SESSION_KEY = "lecipm_growth_utm_v1";

function hasUtm(u: UtmPayload): boolean {
  return Boolean(u.utmSource || u.utmMedium || u.utmCampaign || u.utmTerm || u.utmContent);
}

function mergeUtm(base: UtmPayload, incoming: UtmPayload): UtmPayload {
  return {
    utmSource: incoming.utmSource ?? base.utmSource,
    utmMedium: incoming.utmMedium ?? base.utmMedium,
    utmCampaign: incoming.utmCampaign ?? base.utmCampaign,
    utmTerm: incoming.utmTerm ?? base.utmTerm,
    utmContent: incoming.utmContent ?? base.utmContent,
  };
}

/** Read merged session UTM (browser only). */
export function getStoredGrowthUtm(): UtmPayload {
  if (typeof window === "undefined") {
    return {
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      utmTerm: null,
      utmContent: null,
    };
  }
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      return {
        utmSource: null,
        utmMedium: null,
        utmCampaign: null,
        utmTerm: null,
        utmContent: null,
      };
    }
    const o = JSON.parse(raw) as Record<string, unknown>;
    return {
      utmSource: typeof o.utmSource === "string" ? o.utmSource : null,
      utmMedium: typeof o.utmMedium === "string" ? o.utmMedium : null,
      utmCampaign: typeof o.utmCampaign === "string" ? o.utmCampaign : null,
      utmTerm: typeof o.utmTerm === "string" ? o.utmTerm : null,
      utmContent: typeof o.utmContent === "string" ? o.utmContent : null,
    };
  } catch {
    return {
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      utmTerm: null,
      utmContent: null,
    };
  }
}

/**
 * Merge current URL UTMs into sessionStorage so signup/booking payloads can attach them
 * even after the user navigates away from the landing URL.
 */
export function persistGrowthUtmFromCurrentUrl(): void {
  if (typeof window === "undefined") return;
  const fromUrl = parseUtmFromUrl(`${window.location.pathname}${window.location.search}`);
  if (!hasUtm(fromUrl)) return;
  const prev = getStoredGrowthUtm();
  const merged = mergeUtm(prev, fromUrl);
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(merged));
  } catch {
    /* ignore quota */
  }
}

/** Shape for POST /api/auth/register body — merged in `buildSignupAttributionPayload`. */
export function getGrowthUtmForSignupBody(): {
  lecipmUtm?: { source: string | null; medium: string | null; campaign: string | null };
} {
  const u = getStoredGrowthUtm();
  if (!hasUtm(u)) return {};
  return {
    lecipmUtm: {
      source: u.utmSource,
      medium: u.utmMedium,
      campaign: u.utmCampaign,
    },
  };
}
