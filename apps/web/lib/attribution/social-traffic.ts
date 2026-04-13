import { getLeadAttributionFromRequest, type LeadAttribution } from "@/lib/attribution/lead-attribution";
import {
  attributionFromSearchParams,
  parseAttributionCookieHeader,
} from "@/lib/attribution/cookie-value";

/** Tab session — which social channel drove this visit (tiktok | instagram). */
export const SOCIAL_SOURCE_SESSION_KEY = "lecipm_social_source";

/** JSON snapshot: utm + normalized social source for the browser tab. */
export const SOCIAL_TRAFFIC_CTX_SESSION_KEY = "lecipm_social_traffic_ctx";

export type SocialTrafficFlatMeta = {
  utm_source?: string;
  utm_campaign?: string;
  utm_medium?: string;
  /** Normalized when utm_source maps to TikTok or Instagram */
  social_source?: "tiktok" | "instagram";
};

/**
 * Map raw acquisition source (usually utm_source) to a canonical social channel.
 */
export function normalizeSocialPlatformSource(raw: string | null | undefined): "tiktok" | "instagram" | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();
  if (s === "tiktok" || s.includes("tiktok")) return "tiktok";
  if (s === "instagram" || s.includes("instagram") || s === "ig") return "instagram";
  return null;
}

export function attributionToFlatMeta(attr: LeadAttribution): SocialTrafficFlatMeta {
  const rawSource = attr.source && attr.source !== "direct" ? attr.source : null;
  const out: SocialTrafficFlatMeta = {};
  if (rawSource) out.utm_source = rawSource;
  if (attr.campaign) out.utm_campaign = attr.campaign;
  if (attr.medium) out.utm_medium = attr.medium;
  const social = normalizeSocialPlatformSource(rawSource);
  if (social) out.social_source = social;
  return out;
}

/**
 * Merge first-touch / resolved attribution into metadata (server: cookie + optional JSON body).
 * Later keys in the attribution slice win over client meta for UTM fields (anti-spoof from first-touch cookie).
 */
export function mergeTrafficAttributionIntoMetadata(
  cookieHeader: string | null | undefined,
  metadata: Record<string, unknown>,
  body?: unknown
): Record<string, unknown> {
  const attr = getLeadAttributionFromRequest(cookieHeader, body);
  const slice = attributionToFlatMeta(attr) as Record<string, unknown>;
  return { ...metadata, ...slice };
}

/**
 * Client-side: URL params on this navigation + first-touch cookie (same shape as server merge).
 * Persists `social_source` in sessionStorage for the tab when recognized.
 */
export function getClientLeadAttributionForBeacon(): LeadAttribution {
  if (typeof window === "undefined") {
    return { source: "direct", campaign: null, medium: null };
  }
  try {
    const url = attributionFromSearchParams(new URLSearchParams(window.location.search));
    const cookie = parseAttributionCookieHeader(document.cookie);
    const source = url.source ?? cookie?.source ?? null;
    const campaign = url.campaign ?? cookie?.campaign ?? null;
    const medium = url.medium ?? cookie?.medium ?? null;
    if (!source && !campaign && !medium) {
      return { source: "direct", campaign: null, medium: null };
    }
    return {
      source: source ?? "direct",
      campaign,
      medium,
    };
  } catch {
    return { source: "direct", campaign: null, medium: null };
  }
}

function persistSocialSessionContext(flat: SocialTrafficFlatMeta): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    if (flat.social_source) {
      sessionStorage.setItem(SOCIAL_SOURCE_SESSION_KEY, flat.social_source);
    }
    if (flat.utm_source || flat.utm_campaign || flat.social_source) {
      sessionStorage.setItem(
        SOCIAL_TRAFFIC_CTX_SESSION_KEY,
        JSON.stringify({
          utm_source: flat.utm_source ?? null,
          utm_campaign: flat.utm_campaign ?? null,
          utm_medium: flat.utm_medium ?? null,
          social_source: flat.social_source ?? null,
          updatedAt: Date.now(),
        })
      );
    }
  } catch {
    /* quota / private mode */
  }
}

/** Flat UTM + social_source for client beacons (listing_view, booking_*, listing_click). */
export function getClientTrafficAttributionMeta(): SocialTrafficFlatMeta {
  const attr = getClientLeadAttributionForBeacon();
  const flat = attributionToFlatMeta(attr);
  persistSocialSessionContext(flat);
  return flat;
}
