import { getLeadAttributionFromRequest, type LeadAttribution } from "@/lib/attribution/lead-attribution";
import { parseUtmFromUrl } from "@/modules/attribution/utm-parser";

/** Normalized marketing channel for first 100 users reporting. */
export type AcquisitionChannel = "tiktok" | "instagram" | "facebook" | "outreach" | "direct" | "organic" | "other";

export type SignupAttributionPayload = {
  channel: AcquisitionChannel;
  utm: {
    source: string | null;
    medium: string | null;
    campaign: string | null;
    term: string | null;
    content: string | null;
  };
  /** Query param `?src=` on /auth/signup (tiktok, instagram, facebook, outreach). */
  explicitSrc: string | null;
  capturedAt: string;
};

function normalizeChannel(attr: LeadAttribution, explicitSrc: string | null | undefined): AcquisitionChannel {
  const e = explicitSrc?.trim().toLowerCase();
  if (e === "tiktok" || e === "instagram" || e === "facebook" || e === "outreach") {
    return e;
  }
  const s = (attr.source ?? "").toLowerCase();
  const m = (attr.medium ?? "").toLowerCase();
  const c = (attr.campaign ?? "").toLowerCase();
  if (s.includes("tiktok")) return "tiktok";
  if (s.includes("instagram") || s === "ig") return "instagram";
  if (s.includes("facebook") || s.includes("fb") || s === "meta") return "facebook";
  if (m.includes("outreach") || s.includes("outreach") || c.includes("outreach")) return "outreach";
  if (s === "google" || m.includes("organic") || s.includes("bing")) return "organic";
  if (s && s !== "direct") return "other";
  return "direct";
}

/**
 * Build JSON persisted on `User.signupAttributionJson` at registration.
 * Uses first-touch attribution cookie + optional `traffic*` body fields from the client + `?src=` / `acquisitionChannel`.
 */
export function buildSignupAttributionPayload(
  cookieHeader: string | null | undefined,
  body: unknown,
  explicitSrcFromQuery?: string | null,
  /** e.g. `request.nextUrl.search` — captures full UTM set including term/content */
  signupPageSearch?: string | null
): SignupAttributionPayload | null {
  const attr = getLeadAttributionFromRequest(cookieHeader, body);
  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const sessionUtm = o.lecipmUtm && typeof o.lecipmUtm === "object" ? (o.lecipmUtm as Record<string, unknown>) : null;
  const explicitFromBody =
    typeof o.acquisitionChannel === "string"
      ? o.acquisitionChannel
      : typeof o.src === "string"
        ? o.src
        : null;
  const explicit = (explicitSrcFromQuery?.trim() || explicitFromBody?.trim() || null) as string | null;
  const channel = normalizeChannel(attr, explicit);
  const hasUtm = Boolean(attr.source && attr.source !== "direct") || attr.campaign || attr.medium;
  const fromUrl = parseUtmFromUrl(signupPageSearch ?? undefined);
  const fromSession =
    sessionUtm && (typeof sessionUtm.source === "string" || typeof sessionUtm.campaign === "string")
      ? {
          utmSource: typeof sessionUtm.source === "string" ? sessionUtm.source : null,
          utmMedium: typeof sessionUtm.medium === "string" ? sessionUtm.medium : null,
          utmCampaign: typeof sessionUtm.campaign === "string" ? sessionUtm.campaign : null,
          utmTerm: null as string | null,
          utmContent: null as string | null,
        }
      : null;
  const hasUtmFull =
    hasUtm ||
    Boolean(fromUrl.utmTerm || fromUrl.utmContent) ||
    Boolean(fromUrl.utmSource && fromUrl.utmSource !== "direct") ||
    Boolean(fromSession?.utmSource || fromSession?.utmCampaign);
  if (!hasUtmFull && channel === "direct" && !explicit) {
    return {
      channel: "direct",
      utm: { source: null, medium: null, campaign: null, term: null, content: null },
      explicitSrc: null,
      capturedAt: new Date().toISOString(),
    };
  }
  return {
    channel,
    utm: {
      source: attr.source ?? fromUrl.utmSource ?? fromSession?.utmSource ?? null,
      medium: attr.medium ?? fromUrl.utmMedium ?? fromSession?.utmMedium ?? null,
      campaign: attr.campaign ?? fromUrl.utmCampaign ?? fromSession?.utmCampaign ?? null,
      term: fromUrl.utmTerm,
      content: fromUrl.utmContent,
    },
    explicitSrc: explicit,
    capturedAt: new Date().toISOString(),
  };
}
